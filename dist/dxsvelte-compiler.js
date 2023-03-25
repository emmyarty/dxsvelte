#!/usr/bin/env node

var A=`#!/usr/bin/python3\r
import os\r
import sys\r
sys.path.append(os.getcwd())\r
import django\r
from django.urls import get_resolver, URLPattern, URLResolver\r
from django.urls.resolvers import RoutePattern\r
import json\r
import re\r
\r
os.environ.setdefault('DJANGO_SETTINGS_MODULE', '{{app_name}}.settings')\r
django.setup()\r
\r
def get_urls_json():\r
    resolver = get_resolver()\r
    url_patterns = []\r
\r
    class DjangoJSONEncoder(json.JSONEncoder):\r
        def default(self, obj):\r
            if isinstance(obj, RoutePattern):\r
                return str(obj)\r
            elif isinstance(obj, re.Pattern):\r
                return obj.pattern\r
            elif hasattr(obj, '__dict__'):\r
                return vars(obj)\r
            return super().default(obj)\r
        \r
    def strip_prefix(obj):\r
        text = str(obj)\r
        regex = '\\w+(\\.\\w+)*(?= at|\\sof)'\r
        output = ""\r
        match = re.search(regex, text)\r
        if match != None:\r
            output = match.group()\r
        return output\r
    \r
    def get_app_path(url_resolver):\r
        if isinstance(url_resolver, URLResolver) and url_resolver.url_patterns and len(url_resolver.url_patterns) > 0 and isinstance(url_resolver.url_patterns[0], URLPattern):\r
            return url_resolver.url_patterns[0].lookup_str.split('.')[0]\r
        else:\r
            return None\r
\r
    def convert_url_pattern(pattern):\r
        if hasattr(pattern, 'url_patterns'):\r
            # URLResolver\r
            return {\r
                'type': 'resolver',\r
                'app_name': pattern.app_name,\r
                'namespace': pattern.namespace,\r
                'url_patterns': [convert_url_pattern(p) for p in pattern.url_patterns],\r
                'prefix': pattern.pattern,\r
                'app_path': get_app_path(pattern)\r
            }\r
        else:\r
            # URLPattern\r
            return {\r
                'type': 'pattern',\r
                'pattern': pattern.pattern,\r
                'name': pattern.name,\r
                'lookup_str': pattern.lookup_str,\r
                'callback': strip_prefix(pattern.callback)\r
            }\r
\r
    for pattern in resolver.url_patterns:\r
        url_patterns.append(convert_url_pattern(pattern))\r
\r
    return json.dumps(url_patterns, cls=DjangoJSONEncoder)\r
\r
output = get_urls_json()\r
\r
#+OPERATIONAL+#\r
with open('./{{cache}}/routerResolver.json', 'w') as file:\r
    file.write(output)\r
#+OPERATIONAL+#\r
\r
#+DEBUG+#\r
print(output)\r
#+DEBUG+#`;import{join as V}from"path";import{existsSync as M,mkdirSync as vt,readdirSync as B,readFileSync as gt,rmSync as St,unlinkSync as G}from"fs";import{join as O,resolve as yt}from"path";import*as N from"url";var I="__svcache__",_t="python",v=yt(process.cwd()),wt=N.fileURLToPath(import.meta.url),Rt=N.fileURLToPath(new URL(".",import.meta.url)),u=O(v,I),xt=M(O(v,"manage.py"));xt||(console.error("This script must be run from the Django project's root directory. Exiting."),process.exit(1));console.log(`${v} is a Django project directory. Continuing.`);var Pt=H(),q=H(),w=O(v,q);function H(){let t=/os\.environ\.setdefault\(\s*(['\"`])DJANGO_SETTINGS_MODULE\1\s*,\s*\s*(['\"`])(.+?)\2\s*\)/,e=gt(O(v,"manage.py"),"utf8").match(t)??[],o=e?.length>3?e[3]:"";if(o==="")throw new Error("Could not extract settings from manage.py. Exiting.");return o.split(".")[0]}function F(){M(u)?B(u).forEach(r=>{let e=O(u,r);G(e)}):vt(u,{recursive:!0})}function jt(){B(u).forEach(r=>{let e=O(u,r);G(e)}),St(u,{recursive:!0,force:!0}),console.log(`Cleaned ${I} artefacts.`)}var k={app_name:Pt,cache:I,pythonCmd:_t,__basedir:v,__filename:wt,__dirname:Rt,__cache:u,__main:q,__maindir:w,prepareSvCache:F,cleanSvCache:jt};import{writeFileSync as Ot}from"fs";function Ct(t){return t&&t.replace(/\\/g,"/")}function Et(t,r){if(r.length<2)throw new Error(`${r} is not a valid component file.`);let e=`${r.slice(1)}.svelte`;return Ct(V(v,t,"views",e))}function bt(t){return t.length<2?t:t.charAt(1).toUpperCase()+t.slice(2).replace("$","")}function Dt(t){if(t.length===0)return t;let r=t.charAt(0).toUpperCase();return t.length===1?r:r+t.slice(1)}function W(...t){return"/"+t.join("/").replace(/\/\/+/g,"/").replace(/^\/|\/$/g,"")}function Q(t){let r=[],e=(o,a)=>{if(a.type==="resolver"){if(!Array.isArray(a.url_patterns))return null;a.url_patterns.map(n=>{e({...a},n)})}if(a.type==="pattern"){if(!o||!o.app_path||!o.prefix||typeof a.pattern!="string"||!a.name||a.name[0]!=="$")return null;let n={app:o.app_path,path:o.prefix?W(o.prefix,a.pattern):W(a.pattern),view:a.name??null,component:a.name?Dt(o.app_path)+bt(a.name):null,filename:a.name&&o.app_path?Et(o.app_path,a.name):null};r.push(n)}};return Array.isArray(t)&&(t.map(o=>e(null,o)),Ot(V(u,"debugRouter.json"),JSON.stringify(r,null,2))),r}import{execSync as At}from"child_process";import{readFileSync as Nt,writeFileSync as It}from"fs";import K from"path";import{readFileSync as se}from"fs";import{resolve as X}from"path";import{compile as Lt}from"svelte/compiler";function R(t,r){return Object.keys(t).forEach(e=>{let o=new RegExp(`{{${e}}}`,"g"),a=new RegExp(`{{!${e}}}`,"g");r=r.replace(o,t[e]),r=r.replace(a,`{{${e}}}`)}),r}function $t(t,r){let e=X(t);return r.find(o=>X(o.sourcefile)===e)??null}function z(t=[],r){return{name:"virtual-file-injector",setup(e){e.onResolve({filter:/\.vf\.[\S]+$/},async o=>(console.log("VF Resolved: "+o.path),{path:o.path})),e.onLoad({filter:/\.vf\.[\S]+$/},async o=>{let a=$t(o.path,t),n=a.contents,s=a.loader;if(s==="svelte"){let f=Lt(n,r)?.js?.code??null;if(!f)throw new Error("Compilation Failed for: "+o.path);return{contents:f,loader:"js"}}return{contents:n,loader:s}})}}}var{__cache:Y,app_name:Ft,cache:kt}=k;function Z(){console.log("Getting router...");function t(n,s){let i=new RegExp(`#\\+${s}\\+#([\\s\\S]*?)#\\+${s}\\+#`,"gm"),f=new RegExp("#\\+([\\S]*?)\\+#","gm");return n=n.replace(i,""),n=n.replace(f,""),n}let r;r=process.env.NODE_ENV==="debug"?t(A,"OPERATIONAL"):t(A,"DEBUG"),r=R({app_name:Ft,cache:kt},r);function e(){let n=K.join(Y,"tmp"),s=K.join(Y,"routerResolver.json");try{It(n,r),At(`${k.pythonCmd} ${n}`);let i=Nt(s,"utf8");return JSON.parse(i)}catch(i){throw console.error(i),new Error("Could Not Load Django Router Object")}}let o=e();return Q(o)}var tt="<body><slot/></body>";var et=`<script>\r
  // import { currentPathStore, goto } from '@harika/router'\r
  // import Layout from '../{{__main}}/layout.svelte'\r
  import { currentPathStore } from "{{router}}";\r
  {{layoutImportStatement}};\r
  {{svelteComponentImports}};\r
  export let currentRoute;\r
  currentPathStore.set(currentRoute);\r
  currentPathStore.subscribe((value) => {\r
    if (currentRoute !== value) {\r
      currentRoute = value;\r
    }\r
  });\r
</script>\r
\r
<!-- svelte-ignore missing-declaration -->\r
<Layout>\r
  {{svelteComponentsIfs}}\r
</Layout>\r
`;var rt=`// Import compiled SSR Svelte app.\r
import App from '{{App}}';\r
\r
// Import the data store\r
// import { data } from "{{fnameData}}";\r
\r
// Janky temporary workaround to avoid unneeded stdio outputs\r
const SSRPATH = process.argv[2];\r
const SSRJSON = process.argv[3];\r
const __console = console;\r
\r
const currentRoute = SSRPATH ?? "/"\r
\r
let initialDataPayload = {}\r
let initialDataPayloadScript = ''\r
\r
try {\r
  const jsonString = decodeURIComponent(SSRJSON)\r
  const jsonObject = JSON.parse(jsonString)\r
  initialDataPayload[currentRoute] = jsonObject\r
  initialDataPayloadScript = \`<script>\r
  window.onload = function () {\r
    window.initialDataPayload = { route: \\\`\${currentRoute}\\\`, data: JSON.parse(\\\`\${jsonString}\\\`) };\r
  };\r
  </script>\`\r
} catch (err) {\r
  \r
}\r
\r
console = new Proxy(\r
  {},\r
  {\r
    get(target, prop) {\r
      return function () {};\r
    },\r
  }\r
);\r
\r
// Mount and render the application\r
const { head, html, css } = App.render({\r
  currentRoute\r
});\r
\r
const htmlPreload = html + initialDataPayloadScript\r
\r
// Gather the application parts back into an object and serialise them into JSON\r
const outputJSON = JSON.stringify({ head, html: htmlPreload, css });\r
\r
// Pipe the output into the console using the hijacked console\r
__console.log(outputJSON);`;var nt=`// Import compiled CSR Svelte app.\r
import App from '{{App}}';\r
\r
// Clean up the pathname argument.\r
function clPath (str) {\r
  str = str.replace(/^\\/|\\/$/g, "");\r
  str = str.replace(/\\/{2,}/g, "/");\r
  str = \`/\${str}\`;\r
  return str\r
}\r
\r
// Mount the application.\r
new App({\r
    target: document.body,\r
    props: {\r
      currentRoute: clPath(window.location.pathname)\r
    }\r
})`;var ot=`import { writable } from "svelte/store";\r
\r
function onlyPath(path) {\r
  let queryIndex = path.indexOf("?");\r
  if (queryIndex !== -1) {\r
    path = path.slice(0, queryIndex);\r
  }\r
  path = path.replace(/^\\/|\\/$/g, "");\r
  path = path.replace(/\\/{2,}/g, "/");\r
  path = "/" + path;\r
  return path;\r
}\r
\r
export const currentPathStore = writable("/");\r
\r
// The path as the key and the component is the value. This will be interpolated with a JSON representation of the routes.\r
export const routes = JSON.parse(\`{{router}}\`);\r
\r
export const serverDataStore = {};\r
\r
class ServerDataStore {\r
  constructor(storePath, stale = true, data = {}) {\r
    this.storePath = storePath;\r
    // Currently no way of setting this\r
    this.stale = stale;\r
    this.data = data;\r
    // If the page was hydrated through SSR, then we can expect a global store to exist which we can import as the current state\r
    if (\r
      typeof window !== "undefined" &&\r
      typeof window === "object" &&\r
      window.mode !== "ssr" &&\r
      window.initialDataPayload?.route === currentPathStore\r
    ) {\r
      this.data = window.initialDataPayload.data\r
    }\r
  }\r
  async fetch() {\r
    let result = {}\r
    try {\r
      const { protocol, hostname, port } = window.location;\r
      const portDefault = protocol === 'https:' ? '443' : '80';\r
      const hostnameQualified = \`\${hostname}\${port && port !== portDefault ? ':' + port : ''}\`;\r
      const loc = \`\${protocol}//\${hostnameQualified}\${this.storePath}\`;\r
      // Note: CSRF?\r
      const reqOptions = {\r
        method: "DXS",\r
        headers: { "Content-Type": "application/json" }\r
      }\r
      const resultRaw = await fetch(loc, reqOptions);\r
      const resultJson = await resultRaw.json();\r
      result = resultJson\r
      console.dir(result)\r
    } catch (err) {\r
      console.error('Server Request Failed - Contact Site Administrator.')\r
    }\r
    console.info('DXS GET Result: ', result)\r
    this.data = result;\r
  }\r
}\r
\r
routes.map(\r
  (route) =>\r
    (serverDataStore[route] = new ServerDataStore(route))\r
);\r
\r
async function refreshServerStore(store) {\r
  if (!serverDataStore[store] ?? serverDataStore[store].stale === false)\r
    return null;\r
  await serverDataStore[store].fetch();\r
}\r
\r
export const goto = (href) => {\r
  return () => {\r
    const thisPath = onlyPath(href)\r
    // Guard clause to navigate to destinations not within the scope of the SPA router\r
    if (!routes.some((route) => thisPath === route)) {\r
      return (window.location.href = href);\r
    }\r
    // Push the href into the history stack and update the stored location\r
    window.history.pushState({}, "", href);\r
    currentPathStore.set(thisPath);\r
    refreshServerStore(thisPath);\r
  };\r
};\r
\r
if (\r
  typeof window !== "undefined" &&\r
  typeof window === "object" &&\r
  window.mode !== "ssr"\r
) {\r
  if (window?.initialDataPayload) {\r
    delete window.initialDataPayload\r
  }\r
  console.log(routes);\r
  function hrefHandle(e) {\r
    if (e.target.tagName.toLowerCase() === "a") {\r
      e.preventDefault();\r
      const href = e.target.getAttribute("href");\r
      if (typeof href !== "string") {\r
        return console.error("Invalid Href Attribute");\r
      }\r
      goto(href)();\r
    }\r
  }\r
  document.addEventListener("click", function (e) {\r
    if (e.target.tagName.toLowerCase() === "a") {\r
      hrefHandle(e);\r
    }\r
  });\r
  document.addEventListener("keydown", function (e) {\r
    if (e.keyCode === 13 && e.target.tagName.toLowerCase() === "a") {\r
      e.target.click();\r
    }\r
  });\r
}\r
\r
export default { routes, goto };\r
`;var at=`import { writable } from "svelte/store";\r
import { serverDataStore, currentPathStore } from "{{fnameRouter}}";\r
\r
export const data = writable({});\r
\r
currentPathStore.subscribe((currentPath) => {\r
  if (!serverDataStore[currentPath]) return null\r
  data.set(serverDataStore[currentPath].data);\r
});`;import{existsSync as Jt}from"fs";function _(t){return t&&t.replace(/\\/g,"/")}import{join as j}from"path";function st(t){let r=[];function e(c,mt){let U=c.split("."),dt=U[U.length-1],ht={contents:mt,sourcefile:c,loader:dt};r.push(ht)}let o=_(j(w,"layout.svelte"));Jt(o)||(o=_(j(w,"layout.vf.svelte")),e(o,tt));let a=_(j(u,"root.vf.svelte")),n=`import Layout from '${o}'`,s=c=>`import ${c.component} from '${c.filename}'`,i=c=>`{#if currentRoute === '${c.path}'}<${c.component}></${c.component}>{/if}`,f=t.map(c=>s(c)),g=t.map(c=>i(c)),S=f.join(`
`),y=g.join(`
`),m=JSON.stringify(t.map(c=>c.path)),d=_(j(w,"router.vf.js")),h=R({router:m},ot);e(d,h);let x=_(j(w,"data.vf.js")),C=R({fnameRouter:d},at);e(x,C);let E=R({router:d,layoutImportStatement:n,svelteComponentImports:S,svelteComponentsIfs:y},et),b=R({App:a},rt),l=R({App:a},nt),p=`${_(j(u,"ssr.vf.js"))}`,P=`${_(j(u,"csr.vf.js"))}`;return e(a,E),e(p,b),e(P,l),{vfLoaders:r,entrypointSSRPath:p,entrypointCSRPath:P}}import Wt from"esbuild";import{preprocess as Tt,compile as Ut}from"svelte/compiler";import{dirname as Mt,basename as it,relative as Bt}from"path";import{promisify as Gt}from"util";import{readFile as qt,statSync as D}from"fs";var lt=({message:t,start:r,end:e,filename:o,frame:a})=>({text:t,location:r&&e&&{file:o,line:r.line,column:r.column,length:r.line===e.line?e.column-r.column:0,lineText:a}}),ct=t=>t.initialOptions.incremental||t.initialOptions.watch,Ht=Buffer?t=>Buffer.from(t).toString("base64"):t=>btoa(encodeURIComponent(t));function pt(t){return"data:application/json;charset=utf-8;base64,"+Ht(t)}var J=/\.svelte$/,ut=/\.esbuild-svelte-fake-css$/;function ft(t){let r=t?.include??J;return{name:"esbuild-svelte",setup(e){t||(t={}),t.cache==null&&ct(e)&&(t.cache=!0),t.fromEntryFile==null&&(t.fromEntryFile=!1),t.filterWarnings==null&&(t.filterWarnings=()=>!0);let o=new Map,a=new Map;e.onResolve({filter:r},({path:n,kind:s})=>{if(s==="entry-point"&&t?.fromEntryFile)return{path:n,namespace:"esbuild-svelte-direct-import"}}),e.onLoad({filter:r,namespace:"esbuild-svelte-direct-import"},async n=>({errors:[{text:"esbuild-svelte does not support creating entry files yet"}]})),e.onLoad({filter:r},async n=>{var s;let i=null,f=[];if(t?.cache===!0&&a.has(n.path)){i=a.get(n.path)||{dependencies:new Map,data:null};let d=!0;try{i.dependencies.forEach((h,x)=>{D(x).mtime>h&&(d=!1)})}catch{d=!1}if(d)return i.data;a.delete(n.path)}let g=await Gt(qt)(n.path,"utf8"),S=Bt(process.cwd(),n.path),y=new Map;y.set(n.path,D(n.path).mtime);let m={css:!1,...t?.compilerOptions};try{let d=g;if(t?.preprocess){let l=null;try{l=await Tt(g,t.preprocess,{filename:S})}catch(p){throw e.initialOptions.watch&&i&&(f=Array.from(i.dependencies.keys())),p}if(l.map){let p=l.map;for(let P=0;P<p?.sources.length;P++)p.sources[P]==S&&(p.sources[P]=it(S));m.sourcemap=p}d=l.code,t?.cache===!0&&((s=l.dependencies)==null||s.forEach(p=>{y.set(p,D(p).mtime)}))}let{js:h,css:x,warnings:C}=Ut(d,{...m,filename:S});if(m.sourcemap){h.map.sourcesContent==null&&(h.map.sourcesContent=[]);for(let l=0;l<h.map.sources.length;l++)h.map.sources[l]==it(S)&&(h.map.sourcesContent[l]=g,l=1/0)}let E=h.code+`
//# sourceMappingURL=`+pt(h.map.toString());if((m.css===!1||m.css==="external")&&x.code){let l=n.path.replace(".svelte",".esbuild-svelte-fake-css").replace(/\\/g,"/");o.set(l,x.code+`/*# sourceMappingURL=${pt(x.map.toString())} */`),E=E+`
import "${l}";`}t?.filterWarnings&&(C=C.filter(t.filterWarnings));let b={contents:E,warnings:C.map(lt)};return t?.cache===!0&&a.set(n.path,{data:b,dependencies:y}),e.initialOptions.watch&&(b.watchFiles=Array.from(y.keys())),b}catch(d){return{errors:[lt(d)],watchFiles:f}}}),e.onResolve({filter:ut},({path:n})=>({path:n,namespace:"fakecss"})),e.onLoad({filter:ut,namespace:"fakecss"},({path:n})=>{let s=o.get(n);return s?{contents:s,loader:"css",resolveDir:Mt(n)}:null}),ct(e)&&t?.cache=="overzealous"&&typeof e.onEnd=="function"&&(e.initialOptions.metafile=!0,e.onEnd(n=>{var s,i,f;for(let g in(s=n.metafile)==null?void 0:s.inputs)if(J.test(g)){let S=(i=n.metafile)==null?void 0:i.inputs[g];(f=S?.imports)==null||f.forEach(y=>{if(J.test(y.path)){let m=a.get(g);m!=null&&(m?.dependencies.set(y.path,D(y.path).mtime),a.set(g,m))}})}}))}}}import{join as L}from"path";import{mkdirSync as Vt}from"fs";var Qt=_(L(w,"data.vf.js"));function Xt(){return{name:"svelte-data-resolver",setup(t){t.onResolve({filter:/^@data$/},r=>({path:Qt}))}}}function T(t,r,e){console.log(e,t);let n=e==="ssr"?{generate:"ssr",dev:!1,hydratable:!0,format:"esm"}:{generate:"dom",dev:!1,format:"esm"};try{Vt(L(v,"static"))}catch{}let s=e==="ssr"?L(w,"svelte.ssr.js"):L(v,"static","svelte.csr.js");return Wt.build({entryPoints:[t],mainFields:["svelte","browser","module","main"],bundle:!0,outfile:s,format:"esm",plugins:[z(r,n),Xt(),ft({preprocess:[],compilerOptions:n})]}).catch(()=>{console.error(e==="csr"?"CSR Application Build Failed. Exiting.":"SSR Application Build Failed. Exiting."),process.exit(1)})}F();var zt=Z(),$=st(zt);await T($.entrypointCSRPath,$.vfLoaders,"csr");await T($.entrypointSSRPath,$.vfLoaders,"ssr");
//# sourceMappingURL=dxsvelte-compiler.js.map
