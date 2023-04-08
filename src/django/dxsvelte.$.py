# Import necessary libraries
import base64
from django.http import HttpResponse
from django.conf import settings
from django.urls import resolve
from os.path import join, exists
import json
from py_mini_racer import MiniRacer
from django.middleware.csrf import get_token # Currently unused, on the to-do list

# Check for existence of Svelte SSR files and set defaults if they don't exist
project = settings.ROOT_URLCONF.split('.')[0]

# Load the Svelte SSR JavaScript file, or set to an erroneous default if it doesn't exist
svelte_ssr_js_path = join(settings.BASE_DIR, project, "svelte.ssr.js")
if exists(svelte_ssr_js_path):
    svelte_ssr_js_utf8 = open(svelte_ssr_js_path, "r").read()
else:
    svelte_ssr_js_utf8 = "result = { html: \"404\" };"

# Load the Svelte SSR HTML file, or set to a default value if it doesn't exist
svelte_ssr_html_path = join(settings.BASE_DIR, "static", "index.html")
if exists(svelte_ssr_html_path):
    svelte_ssr_html_utf8 = open(svelte_ssr_html_path, "r").read()
else:
    svelte_ssr_html_utf8 = """<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" /><meta content="width=device-width, initial-scale=1.0" name="viewport" /><meta name="viewport" content="width=device-width" /><title>Django App</title><link rel="stylesheet" href="/static/svelte.csr.css"></head><body>{{app}}</body><script src='/static/svelte.csr.js' defer></script></html>"""

# Concatenate path components and normalise the result
def abs_path(*paths):
    joined_path = '/'.join(paths)
    cleaned_path = joined_path.replace('//', '/')
    if cleaned_path.startswith('/'):
        final_path = cleaned_path
    else:
        final_path = '/' + cleaned_path
    final_path = final_path.rstrip('/')
    return final_path

# Wrap the Svelte SSR markup with the template container
def svelte_ssr_html_wrap(app):
    return svelte_ssr_html_utf8.replace("{{app}}", app, 1)

# Remove leading and trailing slashes
def _normalise_url(url):
    url = url.strip("/")
    url = "/" + url.lstrip("/")
    return url

# Newline escaping, in abeyance as no longer needed
class JSONEncoderEscaped(json.JSONEncoder):
    def encode(self, obj):
        json_string = super().encode(obj)
        return json_string.replace('\n', '\\n')

# Process the render request given a path and payload
def _render(req_path, data = {}):
    ctx = MiniRacer()
    json_data = json.dumps(data)
    encoded_data = base64.b64encode(json_data.encode('utf-8')).decode('utf-8')
    encoded_str = encoded_data.replace('+', '-').replace('/', '_')
    set_consts = f"const SSRPATH='{req_path}'; const SSRJSON='{encoded_str}';"    
    ctx.eval(set_consts)
    ctx.eval(svelte_ssr_js_utf8)
    resultString = ctx.eval("result")
    resultJson = json.loads(resultString)
    result = resultJson["html"]
    return result

# Add headers and create the response
def _send(request, data, mime):
    response = HttpResponse(data, content_type=mime)
    response.set_cookie(key='X-CSRFToken', value=get_token(request), httponly=True)
    return response

# Define gets and posts more tidily in the views.py, will likely be removed in future
def route(request, get, post):
    if request.method == "GET":
        return get()
    if request.method == "POST":
        return post()

# Handle the incoming request
def render(request, data = {}):
    # This is a variant of 'GET' to serve the SPA fetches
    if 'HTTP_X_DXS_METHOD' in request.META and request.META['HTTP_X_DXS_METHOD'] == 'GET':
        data_json = json.dumps(data)
        return HttpResponse(data_json, content_type="application/json")
    req_path = _normalise_url(resolve(request.path_info).route)
    rendered_output = _render(req_path, data)
    interpolated_output = svelte_ssr_html_wrap(rendered_output)
    return HttpResponse(interpolated_output, content_type="text/html")