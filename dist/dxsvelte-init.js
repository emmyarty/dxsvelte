#!/usr/bin/env node

var c=`# Import necessary libraries\r
import base64\r
from django.http import HttpResponse\r
from django.conf import settings\r
from django.urls import resolve\r
from os.path import join, exists\r
import json\r
from py_mini_racer import MiniRacer\r
from django.middleware.csrf import get_token # Currently unused, on the to-do list\r
\r
# Check for existence of Svelte SSR files and set defaults if they don't exist\r
project = settings.ROOT_URLCONF.split('.')[0]\r
\r
# Load the Svelte SSR JavaScript file, or set to an erroneous default if it doesn't exist\r
svelte_ssr_js_path = join(settings.BASE_DIR, project, "svelte.ssr.js")\r
if exists(svelte_ssr_js_path):\r
    svelte_ssr_js_utf8 = open(svelte_ssr_js_path, "r").read()\r
else:\r
    svelte_ssr_js_utf8 = "result = { html: \\"404\\" };"\r
\r
# Load the Svelte SSR HTML file, or set to a default value if it doesn't exist\r
svelte_ssr_html_path = join(settings.BASE_DIR, "static", "index.html")\r
if exists(svelte_ssr_html_path):\r
    svelte_ssr_html_utf8 = open(svelte_ssr_html_path, "r").read()\r
else:\r
    svelte_ssr_html_utf8 = """<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" /><meta content="width=device-width, initial-scale=1.0" name="viewport" /><meta name="viewport" content="width=device-width" /><title>Django App</title><link rel="stylesheet" href="/static/svelte.csr.css"></head><body>{{app}}</body><script src='/static/svelte.csr.js' defer></script></html>"""\r
\r
# Concatenate path components and normalise the result\r
def abs_path(*paths):\r
    joined_path = '/'.join(paths)\r
    cleaned_path = joined_path.replace('//', '/')\r
    if cleaned_path.startswith('/'):\r
        final_path = cleaned_path\r
    else:\r
        final_path = '/' + cleaned_path\r
    final_path = final_path.rstrip('/')\r
    return final_path\r
\r
# Wrap the Svelte SSR markup with the template container\r
def svelte_ssr_html_wrap(app):\r
    return svelte_ssr_html_utf8.replace("{{app}}", app, 1)\r
\r
# Remove leading and trailing slashes\r
def _normalise_url(url):\r
    url = url.strip("/")\r
    url = "/" + url.lstrip("/")\r
    return url\r
\r
# Newline escaping, in abeyance as no longer needed\r
class JSONEncoderEscaped(json.JSONEncoder):\r
    def encode(self, obj):\r
        json_string = super().encode(obj)\r
        return json_string.replace('\\n', '\\\\n')\r
\r
# Process the render request given a path and payload\r
def _render(req_path, data = {}):\r
    ctx = MiniRacer()\r
    json_data = json.dumps(data)\r
    encoded_data = base64.b64encode(json_data.encode('utf-8')).decode('utf-8')\r
    encoded_str = encoded_data.replace('+', '-').replace('/', '_')\r
    set_consts = f"const SSRPATH='{req_path}'; const SSRJSON='{encoded_str}';"    \r
    ctx.eval(set_consts)\r
    ctx.eval(svelte_ssr_js_utf8)\r
    resultString = ctx.eval("result")\r
    resultJson = json.loads(resultString)\r
    result = resultJson["html"]\r
    return result\r
\r
# Add headers and create the response\r
def _send(request, data, mime):\r
    response = HttpResponse(data, content_type=mime)\r
    response.set_cookie(key='X-CSRFToken', value=get_token(request), httponly=True)\r
    return response\r
\r
# Define gets and posts more tidily in the views.py, will likely be removed in future\r
def route(request, get, post):\r
    if request.method == "GET":\r
        return get()\r
    if request.method == "POST":\r
        return post()\r
\r
# Handle the incoming request\r
def render(request, data = {}):\r
    # This is a variant of 'GET' to serve the SPA fetches\r
    if 'HTTP_X_DXS_METHOD' in request.META and request.META['HTTP_X_DXS_METHOD'] == 'GET':\r
        data_json = json.dumps(data)\r
        return HttpResponse(data_json, content_type="application/json")\r
    req_path = _normalise_url(resolve(request.path_info).route)\r
    rendered_output = _render(req_path, data)\r
    interpolated_output = svelte_ssr_html_wrap(rendered_output)\r
    return HttpResponse(interpolated_output, content_type="text/html")`;var d=`{
  "name": "{{__main}}",
  "type": "module",
  "scripts": {
    "refresh": "node ./node_modules/dxsvelte/dist/dxsvelte-init.js",
    "compile": "node ./node_modules/dxsvelte/dist/dxsvelte-compiler.js"
  },
  "devDependencies": {
    "dxsvelte": "*",
    "@types/node": "^18.14.6",
    "autoprefixer": "^10.4.14",
    "esbuild": "0.17.11",
    "esbuild-plugin-inline-import": "^1.0.1",
    "esbuild-plugin-postcss": "^0.1.4",
    "esbuild-svelte": "^0.7.3",
    "js-base64": "^3.7.5",
    "postcss": "^8.4.21",
    "svelte": "^3.58.0",
    "svelte-preprocess": "^5.0.3"
  }
}
`;var u=`{\r
  "compilerOptions": {\r
    "target": "ES2022",\r
    "lib": ["ES2022", "dom"],\r
    "allowJs": true,\r
    "skipLibCheck": true,\r
    "esModuleInterop": true,\r
    "allowSyntheticDefaultImports": true,\r
    "strict": true,\r
    "forceConsistentCasingInFileNames": true,\r
    "noFallthroughCasesInSwitch": true,\r
    "module": "ES2022",\r
    "moduleResolution": "node",\r
    "noEmit": true,\r
    "baseUrl": ".",\r
    "paths": {\r
      "@main/*": ["{{__main}}/*"]\r
    }\r
  },\r
  "ts-node": {\r
    "esm": true,\r
    "experimentalSpecifierResolution": "node"\r
  },\r
  "types": ["node"]\r
}\r
`;import{existsSync as y,writeFileSync as E}from"fs";import{existsSync as g,mkdirSync as q,readdirSync as L,readFileSync as v,rmSync as D,unlinkSync as M}from"fs";import{join as i,resolve as S}from"path";import*as l from"url";var x="__svcache__";var r=S(process.cwd()),I=l.fileURLToPath(import.meta.url),F=l.fileURLToPath(new URL(".",import.meta.url)),J=i(r,x),j=g(i(r,"manage.py"));j||(console.error("This script must be run from the Django project's root directory. Exiting."),process.exit(1));console.log(`${r} is a Django project directory. Continuing.`);var A=m(),a=m(),H=i(r,a);function m(){let e=/os\.environ\.setdefault\(\s*(['\"`])DJANGO_SETTINGS_MODULE\1\s*,\s*\s*(['\"`])(.+?)\2\s*\)/,n=v(i(r,"manage.py"),"utf8").match(e)??[],s=n?.length>3?n[3]:"";if(s==="")throw new Error("Could not extract settings from manage.py. Exiting.");return s.split(".")[0]}import{readFileSync as U}from"fs";import{resolve as G}from"path";import{compile as V}from"svelte/compiler";function f(e,t){return Object.keys(e).forEach(n=>{let s=new RegExp(`{{${n}}}`,"g"),o=new RegExp(`{{!${n}}}`,"g");t=t.replace(s,e[n]),t=t.replace(o,`{{${n}}}`)}),t}import{join as _}from"path";function O(e){let t=_(r,e);return y(t)}function R(e){return _(r,e)}function p(e,t,n={}){function s(o){console.error(`Could not install ${o}. If the file already exists from a previous init, ignore this error.`)}if(O(e))s(e);else try{let o=f(n,t);E(R(e),o)}catch{s(e)}}function h(){p("dxsvelte.py",c),p("package.json",d,{__main:a}),p("tsconfig.json",u,{__main:a})}h();console.log(`DxSvelte initialisation completed. Remember to run npm i in order to install local dependencies and
update your .gitignore to exclude node_modules`);
//# sourceMappingURL=dxsvelte-init.js.map
