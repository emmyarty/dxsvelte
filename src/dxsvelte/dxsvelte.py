# Import necessary libraries
from py_mini_racer import MiniRacer
from py_mini_racer.py_mini_racer import JSEvalException
from django.middleware.csrf import get_token
from django.http import HttpResponse
from django.conf import settings
from django.urls import resolve
from warnings import warn
from os.path import join, exists, dirname, basename, abspath, relpath
from os import listdir, makedirs
from sys import stderr
import sourcemap
import base64
import json
import re

# Throw a warning if the package is being imported from node_modules
if basename(dirname(dirname(abspath(__file__)))) == "dist":
    warn("DxSvelte is currently being imported from node_modules. This is not recommended for production use.\nPlease install the Python package for use in production.")


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
    return ""


# Load the Svelte SSR JavaScript file, or set to an erroneous default if it doesn't exist
svelte_ssr_js_path = join(settings.BASE_DIR, project, "app/entrypoint-ssr.js")
if exists(svelte_ssr_js_path):
    svelte_ssr_js_map_path = join(
        settings.BASE_DIR, project, "app/entrypoint-ssr.js.map")
    svelte_ssr_js_utf8 = open(svelte_ssr_js_path, "r", encoding='utf-8').read()
else:
    svelte_ssr_js_map_path = None
    svelte_ssr_js_utf8 = "result = { html: \"500\" };"


# Load the Svelte SSR HTML file, or set to a default value if it doesn't exist
svelte_ssr_html_path = join(settings.BASE_DIR, project, "index.html")
if exists(svelte_ssr_html_path):
    svelte_ssr_html_utf8 = open(
        svelte_ssr_html_path, "r", encoding='utf-8').read()
else:
    svelte_ssr_html_utf8 = """<!doctype html><html><head><meta charset="utf-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" /><meta content="width=device-width, initial-scale=1.0" name="viewport" /><meta name="viewport" content="width=device-width" /><title>Django App</title><link rel="stylesheet" href="{{css}}"></head><body>{{app}}</body><script src='{{csrjs}}' type="module" defer></script></html>"""

# Initialise Svelte asset imports
csr_directory = join(settings.BASE_DIR, "static", "app", "assets")
makedirs(csr_directory, exist_ok=True)
csrjs = "/static/app/assets/" + \
    find_matching_file(csr_directory, "bundle.csr", "js")
css = "/static/app/assets/" + \
    find_matching_file(csr_directory, "entrypoint", "css")
svelte_ssr_html_utf8 = svelte_ssr_html_utf8.replace("{{csrjs}}", csrjs, -1)
svelte_ssr_html_utf8 = svelte_ssr_html_utf8.replace("{{css}}", css, -1)


# Initialise the sourcemap and error parsing
def generate_error_map(source_map_path):
    with open(abspath(source_map_path), 'r') as sourcemap_file:
        imported_sourcemap = sourcemap.load(sourcemap_file)
        tokensDict = {}
        for t in list(imported_sourcemap):
            key = str(t.dst_line) + "_" + str(t.dst_col)
            tokensDict[key] = {
                "src": relpath(abspath(join(svelte_ssr_js_map_path, '..', t.src))),
                "src_line": t.src_line + 1,
                "src_col": t.src_col + 1,
                "name": "<anonymous>" if t.name is None else t.name,
            }

    def error_map(line, column):
        key = str(line-1) + "_" + str(column-1)
        if key in tokensDict:
            return tokensDict[key]
        return None
    return error_map


error_map = generate_error_map(
    svelte_ssr_js_map_path) if svelte_ssr_js_map_path is not None else None


# Print the error trace with the assistance of the sourcemap
def _print_js_error(e):
    def red(text): return f"\033[31m{text}\033[0m"
    def yellow(text): return f"\033[33m{text}\033[0m"
    error_message = str(e.args).split('\\n')
    if error_map is None:
        return
    mapped_error_trace = []
    for index, line in enumerate(error_message):
        if index == 0:
            mapped_error_trace.append(
                f"{red('::  ')}{yellow('JavaScript SSR Error')}")
        elif index == 1:
            mapped_error_trace.append(f"{red('::  ')}{yellow(line)}")
        else:
            line = line.strip()
            split_lines = line.split(':')
            split_lines = [re.sub('[^0-9]', '', item) for item in split_lines]
            lookup_line = int(split_lines[-2])
            lookup_column = int(split_lines[-1])
            mapped_error = error_map(lookup_line, lookup_column)
            if mapped_error is not None:
                mapped_error = f"{red('::')}    at {mapped_error['name']} @ {mapped_error['src']}:{mapped_error['src_line']}:{mapped_error['src_col']}"
                mapped_error_trace.append(mapped_error)
    if len(error_message) < 3:
        mapped_error_trace.append('Unable to map the error trace.')
        f"{red('::')}    <unable to map the error trace>"
    for line in mapped_error_trace:
        print(line, file=stderr)


# Wrap the Svelte SSR markup with the template container
def svelte_ssr_html_wrap(app):
    html = svelte_ssr_html_utf8
    html = html.replace("{{app}}", app, -1)
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
    ctx = MiniRacer()
    json_data = json.dumps(data)
    SSRJSON = _urlencode(json_data)
    SSRCSRF = _urlencode(csrf_token)
    set_consts = f"const SSRPATH='{SSRPATH}'; const SSRJSON='{SSRJSON}'; const SSRCSRF='{SSRCSRF}';"
    ctx.eval(set_consts)
    try:
        resultString = ctx.eval(svelte_ssr_js_utf8)
        resultJson = json.loads(resultString)
        result = resultJson["html"]
        return result
    # If SSR fails, we will log an error but return an empty string so that the CSR can take over
    except JSEvalException as e:
        _print_js_error(e)
        return ""


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
