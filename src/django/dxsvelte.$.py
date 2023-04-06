import base64
from django.http import HttpResponse
from django.conf import settings
from django.urls import resolve
from os.path import join, exists
from subprocess import run
from urllib.parse import quote
import json

from py_mini_racer import MiniRacer

# Currently unused, on the to-do list
from django.middleware import csrf

project = settings.ROOT_URLCONF.split('.')[0]

svelte_ssr_js_path = join(settings.BASE_DIR, project, "svelte.ssr.js")
if exists(svelte_ssr_js_path):
    svelte_ssr_js_utf8 = open(svelte_ssr_js_path, "r").read()
else:
    svelte_ssr_js_utf8 = "console.log(404);"

svelte_ssr_html_path = join(settings.BASE_DIR, "static", "index.html")
if exists(svelte_ssr_html_path):
    svelte_ssr_html_utf8 = open(svelte_ssr_html_path, "r").read()
else:
    svelte_ssr_html_utf8 = """<!doctype html><html><head><meta charset="utf-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" /><meta content="width=device-width, initial-scale=1.0" name="viewport" /><meta name="viewport" content="width=device-width" /><title>Django App</title><link rel="stylesheet" href="/static/svelte.csr.css"></head><body>{{app}}</body><script src='/static/svelte.csr.js' defer></script></html>"""

def abs_path(*paths):
    joined_path = '/'.join(paths)
    cleaned_path = joined_path.replace('//', '/')
    if cleaned_path.startswith('/'):
        final_path = cleaned_path
    else:
        final_path = '/' + cleaned_path
    final_path = final_path.rstrip('/')
    return final_path

def svelte_ssr_html_wrap(app):
    return svelte_ssr_html_utf8.replace("{{app}}", app, 1)

def _normalise_url(url):
    url = url.strip("/")
    url = "/" + url.lstrip("/")
    return url

class JSONEncoderEscaped(json.JSONEncoder):
    def encode(self, obj):
        json_string = super().encode(obj)
        return json_string.replace('\n', '\\n')

def _render(req_path, data = {}):
    json_data = json.dumps(data, ensure_ascii=False, cls=JSONEncoderEscaped)
    encoded_data = base64.b64encode(json_data.encode('utf-8')).decode('utf-8')
    encoded_str = encoded_data.replace('+', '-').replace('/', '_')
    node = run(["node", svelte_ssr_js_path, req_path, encoded_str], capture_output=True, check=True)
    stdout = node.stdout.decode("utf-8")
    node_dict = json.loads(stdout)
    result = node_dict["html"]
    return result

def route(request, get, post):
    if request.method == "GET" or request.method == "DXS":
        return get()
    if request.method == "POST":
        return post()

def render(request, data = {}):
    # This is a variant of GET to serve the SPA fetches
    if request.method == "DXS":
        data_json = json.dumps(data)
        return HttpResponse(data_json, content_type="application/json")
    req_path = _normalise_url(resolve(request.path_info).route)
    rendered_output = _render(req_path, data)
    interpolated_output = svelte_ssr_html_wrap(rendered_output)
    return HttpResponse(interpolated_output, content_type="text/html")