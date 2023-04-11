#!/usr/bin/env node

var m=`# Import necessary libraries\r
import base64\r
from django.http import HttpResponse\r
from django.conf import settings\r
from django.urls import resolve\r
from os.path import join, exists\r
import json\r
from py_mini_racer import MiniRacer\r
from django.middleware.csrf import get_token # Currently unused, on the to-do list\r
\r
# Add @static_view decorator - this adds an attribute to the view which is used by the\r
# router resolver to mark it as a static view, mitigating some unnecessary server hits.\r
def static_view(cb):\r
    def middleware(req):\r
        return cb(req)\r
    middleware.is_static_view = True\r
    return middleware\r
\r
# Check for existence of Svelte SSR files and set defaults if they don't exist\r
project = settings.ROOT_URLCONF.split('.')[0]\r
\r
# Load the Svelte SSR JavaScript file, or set to an erroneous default if it doesn't exist\r
svelte_ssr_js_path = join(settings.BASE_DIR, project, "svelte.ssr.js")\r
if exists(svelte_ssr_js_path):\r
    svelte_ssr_js_utf8 = open(svelte_ssr_js_path, "r", encoding='utf-8').read()\r
else:\r
    svelte_ssr_js_utf8 = "result = { html: \\"404\\" };"\r
\r
# Load the Svelte SSR HTML file, or set to a default value if it doesn't exist\r
svelte_ssr_html_path = join(settings.BASE_DIR, "static", "index.html")\r
if exists(svelte_ssr_html_path):\r
    svelte_ssr_html_utf8 = open(svelte_ssr_html_path, "r", encoding='utf-8').read()\r
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
    return HttpResponse(interpolated_output, content_type="text/html")`;import{accessSync as D,readFileSync as g,writeFileSync as d}from"fs";import{existsSync as S,mkdirSync as I,readdirSync as N,readFileSync as x,rmSync as j,unlinkSync as J}from"fs";import{join as i,resolve as O}from"path";import*as c from"url";var w="__svcache__";var s=O(process.cwd()),F=c.fileURLToPath(import.meta.url),H=c.fileURLToPath(new URL(".",import.meta.url)),L=i(s,w),E=S(i(s,"manage.py"));E||(console.error("This script must be run from the Django project's root directory. Exiting."),process.exit(1));console.log(`${s} is a Django project directory. Continuing.`);var G=f(),T=f(),$=i(s,T);function f(){let e=/os\.environ\.setdefault\(\s*(['\"`])DJANGO_SETTINGS_MODULE\1\s*,\s*\s*(['\"`])(.+?)\2\s*\)/,t=x(i(s,"manage.py"),"utf8").match(e)??[],n=t?.length>3?t[3]:"";if(n==="")throw new Error("Could not extract settings from manage.py. Exiting.");return n.split(".")[0]}import{basename as _,join as R}from"path";function o(e){return R(s,e)}function A(e){try{return D(e),!0}catch{return!1}}var a=null;function y(){if(a!==null)return a;let r=g("./manage.py","utf8").toString().match(/os\.environ\.setdefault\("DJANGO_SETTINGS_MODULE",\s*["'](.+)\.settings["']\)/);if(r){let t=r[1];return t=t.replace(/^"(.*)"$/,"$1"),t=t.replace(/^'(.*)'$/,"$1"),a=t,a}else throw new Error("DJANGO_SETTINGS_MODULE not found in manage.py.")}var l=e=>!(typeof e!="object"||Array.isArray(e)||e===null);async function h(e){try{let r=g(e,"utf8").toString(),t=JSON.parse(r);if(!l(t)){let n=_(e);throw new Error(`File ${n} is an Array. Skipping update.`)}return t}catch(r){if(A(e)){let n=_(e);throw console.error(`File ${n} is not valid. Skipping update.`),r}return{}}}function k(e){let r={target:"ES2022",allowJs:!0,skipLibCheck:!0,esModuleInterop:!0,allowSyntheticDefaultImports:!0,strict:!0,forceConsistentCasingInFileNames:!0,noFallthroughCasesInSwitch:!0,module:"ES2022",moduleResolution:"node",noEmit:!0,baseUrl:"."},t={"@main/*":[y()+"/*"]},n=[];return l(e.compilerOptions)||(e.compilerOptions={}),e.compilerOptions={...e.compilerOptions,...r},typeof e.compilerOptions.lib=="string"&&(e.compilerOptions.lib=[e.compilerOptions.lib]),(typeof e.compilerOptions.lib>"u"||!Array.isArray(e.compilerOptions.lib))&&(e.compilerOptions.lib=[]),e.compilerOptions.lib.includes("ES2022")||e.compilerOptions.lib.push("ES2022"),e.compilerOptions.lib.includes("dom")||e.compilerOptions.lib.push("dom"),typeof e.compilerOptions.paths>"u"&&(e.compilerOptions.paths={}),e.compilerOptions.paths={...e.compilerOptions.paths,...t},n.map(p=>e.compilerOptions.paths[p]?delete e.compilerOptions.paths[p]:null),typeof e.types>"u"&&(e.types=[]),typeof e.types=="string"&&(e.types=[e.types]),e.types.includes("node")||e.types.push("node"),e}function C(e){let r={name:y(),type:"module"},t={refresh:"node ./node_modules/dxsvelte/dist/dxsvelte-init.js",compile:"node ./node_modules/dxsvelte/dist/dxsvelte-compiler.js"},n={dxsvelte:"*","@types/node":"^18.14.6",autoprefixer:"^10.4.14",esbuild:"0.17.11","esbuild-plugin-inline-import":"^1.0.1","esbuild-plugin-postcss":"^0.1.4","esbuild-svelte":"^0.7.3","js-base64":"^3.7.5",postcss:"^8.4.21",svelte:"^3.58.0","svelte-preprocess":"^5.0.3"};return e={...e,...r},l(e.scripts)||(e.scripts={}),e.scripts={...e.scripts,...t},l(e.devDependencies)||(e.devDependencies={}),e.devDependencies={...e.devDependencies,...n},e}var u={dxsvelte:async()=>{let e=()=>console.error("Could not install dxsvelte.py. If the file already exists from a previous init, ignore this error."),r=o("dxsvelte.py");try{d(r,m)}catch{return e(),!1}return!0},package:async()=>{let e=o("package.json"),r=await h(o(e)),t=C(r);return d("./package.json",JSON.stringify(t,null,4)),!0},tsconfig:async()=>{let e=o("tsconfig.json"),r=await h(e),t=k(r);return d("./tsconfig.json",JSON.stringify(t,null,4)),!0}};async function v(){try{if((await Promise.all([u.package(),u.tsconfig(),u.dxsvelte()])).includes(!1))throw new Error("Some or all files could not be updated.");return!0}catch(e){return console.error("Update Failed.",e),!1}}v();console.log(`DxSvelte initialisation completed. Remember to run npm i in order to install local dependencies and
update your .gitignore to exclude node_modules`);
//# sourceMappingURL=dxsvelte-init.js.map
