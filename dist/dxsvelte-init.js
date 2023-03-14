#!/usr/bin/env node

var c=`from django.http import HttpResponse\r
from django.conf import settings\r
from django.urls import resolve\r
from os.path import join, exists\r
from subprocess import run\r
import json\r
\r
svelte_ssr_js_path = join(settings.BASE_DIR, "{{__main}}", "svelte.ssr.js")\r
if exists(svelte_ssr_js_path):\r
    svelte_ssr_js_utf8 = open(svelte_ssr_js_path, "r").read()\r
else:\r
    svelte_ssr_js_utf8 = "console.log(404);"\r
\r
svelte_ssr_html_path = join(settings.BASE_DIR, "static", "index.html")\r
if exists(svelte_ssr_html_path):\r
    svelte_ssr_html_utf8 = open(svelte_ssr_html_path, "r").read()\r
else:\r
    svelte_ssr_html_utf8 = """<!doctype html><html><head><meta charset="utf-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" /><meta content="width=device-width, initial-scale=1.0" name="viewport" /><meta name="viewport" content="width=device-width" /><title>Django App</title></head><body>{{app}}</body><script src='/static/bundle.js' defer></script></html>"""\r
\r
def svelte_ssr_html_wrap(app):\r
    return svelte_ssr_html_utf8.replace("{{__main}}", app, 1)\r
\r
def _normalise_url(url):\r
    url = url.strip("/")\r
    url = "/" + url.lstrip("/")\r
    return url\r
\r
def _render(req_path):\r
    node = run(["node", svelte_ssr_js_path, req_path], capture_output=True, check=True)\r
    stdout = node.stdout.decode("utf-8")\r
    node_dict = json.loads(stdout)\r
    result = node_dict["html"]\r
    return result\r
\r
def route(request, get, post):\r
    if request.method == "GET":\r
        return get()\r
    if request.method == "POST":\r
        return post()\r
\r
def render(request):\r
    req_path = _normalise_url(resolve(request.path_info).route)\r
    rendered_output = _render(req_path)\r
    interpolated_output = svelte_ssr_html_wrap(rendered_output)\r
    return HttpResponse(interpolated_output, content_type="text/html")\r
`;var u=`{
  "name": "{{__main}}",
  "type": "module",
  "scripts": {
    "compile": "node ./node_modules/dxsvelte/dist/dxsvelte-compiler.js"
  },
  "devDependencies": {
    "dxsvelte": "*",
    "@types/node": "^18.14.6",
    "esbuild": "0.17.11",
    "esbuild-plugin-inline-import": "^1.0.1",
    "esbuild-svelte": "^0.7.3",
    "svelte": "^3.56.0"
  }
}`;var d=`{\r
  "compilerOptions": {\r
    "target": "ES2022",\r
    "lib": ["ES2022"],\r
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
    "baseUrl": "."\r
  },\r
  "ts-node": {\r
    "esm": true,\r
    "experimentalSpecifierResolution": "node"\r
  },\r
  "types": ["node"]\r
}\r
`;import{existsSync as y,writeFileSync as E}from"fs";import{existsSync as g,mkdirSync as L,readdirSync as T,readFileSync as v,rmSync as q,unlinkSync as D}from"fs";import{join as i,resolve as x}from"path";import*as p from"url";var j="__svcache__";var r=x(process.cwd()),$=p.fileURLToPath(import.meta.url),k=p.fileURLToPath(new URL(".",import.meta.url)),M=i(r,j),S=g(i(r,"manage.py"));S||(console.error("This script must be run from the Django project's root directory. Exiting."),process.exit(1));console.log(`${r} is a Django project directory. Continuing.`);var A=m(),l=m(),J=i(r,l);function m(){let t=/os\.environ\.setdefault\(\s*(['\"`])DJANGO_SETTINGS_MODULE\1\s*,\s*\s*(['\"`])(.+?)\2\s*\)/,n=v(i(r,"manage.py"),"utf8").match(t)??[],o=n?.length>3?n[3]:"";if(o==="")throw new Error("Could not extract settings from manage.py. Exiting.");return o.split(".")[0]}import{readFileSync as N}from"fs";import{resolve as H}from"path";import{compile as X}from"svelte/compiler";function f(t,e){return Object.keys(t).forEach(n=>{let o=new RegExp(`{{${n}}}`,"g");e=e.replace(o,t[n])}),e}import{join as _}from"path";function O(t){let e=_(r,t);return y(e)}function b(t){return _(r,t)}function a(t,e,n={}){function o(s){console.error(`Could not install ${s}. If the file already exists from a previous init, ignore this error.`)}if(O(t))o(t);else try{let s=f(n,e);E(b(t),s)}catch{o(t)}}function h(){a("dxsvelte.py",c,{__main:l}),a("package.json",u,{__main:l}),a("tsconfig.json",d)}h();console.log(`DxSvelte initialisation completed. Remember to run npm i in order to install local dependencies and
update your .gitignore to exclude node_modules`);
//# sourceMappingURL=dxsvelte-init.js.map
