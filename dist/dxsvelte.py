# Import necessary libraries
import base64
from django.http import HttpResponse
from django.conf import settings
from django.urls import resolve
from os.path import join, exists
from os import listdir
import json
from py_mini_racer import MiniRacer
from django.middleware.csrf import get_token


# Add @static_view decorator - this adds an attribute to the view which is used by the
# router resolver to mark it as a static view, mitigating some unnecessary server hits.
def static_view(cb):
    def middleware(req):
        return cb(req)
    middleware.is_static_view = True
    return middleware


# Check for existence of Svelte SSR files and set defaults if they don't exist
project = settings.ROOT_URLCONF.split('.')[0]


# Find the bundled assets within the directory, retaining hashes for cache-busting
def find_matching_file(directory, prefix, extension):
    for file in listdir(directory):
        if (
            file.startswith(prefix)
            and file.endswith(extension)
            and len(file) > len(prefix + extension)
        ):
            print(file)
            return file
    return None


# Load the Svelte SSR JavaScript file, or set to an erroneous default if it doesn't exist
svelte_ssr_js_path = join(settings.BASE_DIR, project, "bundle.ssr.js")
if exists(svelte_ssr_js_path):
    svelte_ssr_js_utf8 = open(svelte_ssr_js_path, "r", encoding='utf-8').read()
else:
    svelte_ssr_js_utf8 = "result = { html: \"404\" };"


# Load the Svelte SSR HTML file, or set to a default value if it doesn't exist
svelte_ssr_html_path = join(settings.BASE_DIR, "static", "index.html")
if exists(svelte_ssr_html_path):
    svelte_ssr_html_utf8 = open(
        svelte_ssr_html_path, "r", encoding='utf-8').read()
else:
    svelte_ssr_html_utf8 = """<!doctype html><html><head><meta charset="utf-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" /><meta content="width=device-width, initial-scale=1.0" name="viewport" /><meta name="viewport" content="width=device-width" /><title>Django App</title><link rel="stylesheet" href="{{css}}"></head><body>{{app}}</body>{{spa}}<script src='{{csrjs}}' type="module" defer></script></html>"""


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
    csrjs = "/static/bundles/assets/" + \
        find_matching_file(join(settings.BASE_DIR, "static",
                           "bundles", "assets"), "bundle.csr", "js")
    css = "/static/bundles/assets/" + \
        find_matching_file(join(settings.BASE_DIR, "static",
                           "bundles", "assets"), "app", "css")
    html = svelte_ssr_html_utf8
    html = html.replace("{{csrjs}}", csrjs, -1)
    html = html.replace("{{app}}", app, -1)
    html = html.replace("{{css}}", css, -1)
    return html


# Remove leading and trailing slashes
def _normalise_url(url):
    url = url.strip("/")
    url = "/" + url.lstrip("/")
    return url
def _urlencode(input):
    encoded_input = base64.b64encode(input.encode('utf-8')).decode('utf-8')
    encoded_input_urlsafe = encoded_input.replace('+', '-').replace('/', '_')
    return encoded_input_urlsafe


# Process the render request given a path and payload
def _render(SSRPATH, csrf_token, data={}):
    # TODO: RETURN SSR
    return ""
    ctx = MiniRacer()
    json_data = json.dumps(data)
    SSRJSON = _urlencode(json_data)
    SSRCSRF = _urlencode(csrf_token)
    set_consts = f"const SSRPATH='{SSRPATH}'; const SSRJSON='{SSRJSON}'; const SSRCSRF='{SSRCSRF}';"
    ctx.eval(set_consts)
    ctx.eval(svelte_ssr_js_utf8)
    resultString = ctx.eval("result")
    resultJson = json.loads(resultString)
    result = resultJson["html"]
    return result


# Define gets and posts more tidily in the views.py, will likely be removed in future
def route(request, get, post):
    if request.method == "GET":
        return get()
    if request.method == "POST":
        return post()


# Handle the incoming request
def render(request, data={}):
    csrf_token = get_token(request)
    # This is a variant of 'GET' to serve the SPA fetches
    if 'HTTP_X_DXS_METHOD' in request.META and request.META['HTTP_X_DXS_METHOD'] == 'GET':
        data_json = json.dumps(data)
        response = HttpResponse(data_json, content_type="application/json")
        response['Cache-Control'] = 'no-store'
        return response
    req_path = _normalise_url(resolve(request.path_info).route)
    rendered_output = _render(req_path, csrf_token, data)
    interpolated_output = svelte_ssr_html_wrap(rendered_output)
    return HttpResponse(interpolated_output, content_type="text/html")
