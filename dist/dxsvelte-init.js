#!/usr/bin/env node

var c=`import base64\r
from django.http import HttpResponse\r
from django.conf import settings\r
from django.urls import resolve\r
from os.path import join, exists\r
from subprocess import run\r
from urllib.parse import quote\r
import json\r
\r
from py_mini_racer import MiniRacer\r
\r
# Currently unused, on the to-do list\r
from django.middleware import csrf\r
\r
project = settings.ROOT_URLCONF.split('.')[0]\r
\r
svelte_ssr_js_path = join(settings.BASE_DIR, project, "svelte.ssr.js")\r
if exists(svelte_ssr_js_path):\r
    svelte_ssr_js_utf8 = open(svelte_ssr_js_path, "r").read()\r
else:\r
    svelte_ssr_js_utf8 = "console.log(404);"\r
\r
svelte_ssr_html_path = join(settings.BASE_DIR, "static", "index.html")\r
if exists(svelte_ssr_html_path):\r
    svelte_ssr_html_utf8 = open(svelte_ssr_html_path, "r").read()\r
else:\r
    svelte_ssr_html_utf8 = """<!doctype html><html><head><meta charset="utf-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" /><meta content="width=device-width, initial-scale=1.0" name="viewport" /><meta name="viewport" content="width=device-width" /><title>Django App</title><link rel="stylesheet" href="/static/svelte.csr.css"></head><body>{{app}}</body><script src='/static/svelte.csr.js' defer></script></html>"""\r
\r
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
def svelte_ssr_html_wrap(app):\r
    return svelte_ssr_html_utf8.replace("{{app}}", app, 1)\r
\r
def _normalise_url(url):\r
    url = url.strip("/")\r
    url = "/" + url.lstrip("/")\r
    return url\r
\r
class JSONEncoderEscaped(json.JSONEncoder):\r
    def encode(self, obj):\r
        json_string = super().encode(obj)\r
        return json_string.replace('\\n', '\\\\n')\r
\r
def _render(req_path, data = {}):\r
    json_data = json.dumps(data, ensure_ascii=False, cls=JSONEncoderEscaped)\r
    encoded_data = base64.b64encode(json_data.encode('utf-8')).decode('utf-8')\r
    encoded_str = encoded_data.replace('+', '-').replace('/', '_')\r
    node = run(["node", svelte_ssr_js_path, req_path, encoded_str], capture_output=True, check=True)\r
    stdout = node.stdout.decode("utf-8")\r
    node_dict = json.loads(stdout)\r
    result = node_dict["html"]\r
    return result\r
\r
def route(request, get, post):\r
    if request.method == "GET" or request.method == "DXS":\r
        return get()\r
    if request.method == "POST":\r
        return post()\r
\r
def render(request, data = {}):\r
    # This is a variant of GET to serve the SPA fetches\r
    if request.method == "DXS":\r
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
    "postcss": "^8.4.21",
    "svelte": "^3.57.0",
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
      "@{{__main}}/*": ["{{__main}}/*"]\r
    }\r
  },\r
  "ts-node": {\r
    "esm": true,\r
    "experimentalSpecifierResolution": "node"\r
  },\r
  "types": ["node"]\r
}\r
`;import{existsSync as y,writeFileSync as E}from"fs";import{existsSync as g,mkdirSync as L,readdirSync as P,readFileSync as j,rmSync as D,unlinkSync as F}from"fs";import{join as i,resolve as v}from"path";import*as l from"url";var x="__svcache__";var n=v(process.cwd()),$=l.fileURLToPath(import.meta.url),J=l.fileURLToPath(new URL(".",import.meta.url)),M=i(n,x),S=g(i(n,"manage.py"));S||(console.error("This script must be run from the Django project's root directory. Exiting."),process.exit(1));console.log(`${n} is a Django project directory. Continuing.`);var N=m(),a=m(),k=i(n,a);function m(){let e=/os\.environ\.setdefault\(\s*(['\"`])DJANGO_SETTINGS_MODULE\1\s*,\s*\s*(['\"`])(.+?)\2\s*\)/,r=j(i(n,"manage.py"),"utf8").match(e)??[],o=r?.length>3?r[3]:"";if(o==="")throw new Error("Could not extract settings from manage.py. Exiting.");return o.split(".")[0]}import{readFileSync as G}from"fs";import{resolve as H}from"path";import{compile as V}from"svelte/compiler";function f(e,t){return Object.keys(e).forEach(r=>{let o=new RegExp(`{{${r}}}`,"g"),s=new RegExp(`{{!${r}}}`,"g");t=t.replace(o,e[r]),t=t.replace(s,`{{${r}}}`)}),t}import{join as _}from"path";function O(e){let t=_(n,e);return y(t)}function b(e){return _(n,e)}function p(e,t,r={}){function o(s){console.error(`Could not install ${s}. If the file already exists from a previous init, ignore this error.`)}if(O(e))o(e);else try{let s=f(r,t);E(b(e),s)}catch{o(e)}}function h(){p("dxsvelte.py",c),p("package.json",d,{__main:a}),p("tsconfig.json",u,{__main:a})}h();console.log(`DxSvelte initialisation completed. Remember to run npm i in order to install local dependencies and
update your .gitignore to exclude node_modules`);
//# sourceMappingURL=dxsvelte-init.js.map
