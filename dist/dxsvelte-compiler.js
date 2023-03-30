#!/usr/bin/env node

var N=`#!/usr/bin/python3\r
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
#+DEBUG+#`;import{join as Q}from"path";import{existsSync as B,mkdirSync as ve,readdirSync as G,readFileSync as Se,rmSync as ye,unlinkSync as W}from"fs";import{join as j,resolve as _e}from"path";import*as k from"url";var I="__svcache__",Re="python",g=_e(process.cwd()),we=k.fileURLToPath(import.meta.url),xe=k.fileURLToPath(new URL(".",import.meta.url)),u=j(g,I),je=B(j(g,"manage.py"));je||(console.error("This script must be run from the Django project's root directory. Exiting."),process.exit(1));console.log(`${g} is a Django project directory. Continuing.`);var Pe=V(),q=V(),x=j(g,q);function V(){let e=/os\.environ\.setdefault\(\s*(['\"`])DJANGO_SETTINGS_MODULE\1\s*,\s*\s*(['\"`])(.+?)\2\s*\)/,r=Se(j(g,"manage.py"),"utf8").match(e)??[],o=r?.length>3?r[3]:"";if(o==="")throw new Error("Could not extract settings from manage.py. Exiting.");return o.split(".")[0]}function T(){B(u)?G(u).forEach(t=>{let r=j(u,t);W(r)}):ve(u,{recursive:!0})}function F(){G(u).forEach(t=>{let r=j(u,t);W(r)}),ye(u,{recursive:!0,force:!0}),console.log(`Cleaned ${I} artefacts.`)}var J={app_name:Pe,cache:I,pythonCmd:Re,__basedir:g,__filename:we,__dirname:xe,__cache:u,__main:q,__maindir:x,prepareSvCache:T,cleanSvCache:F};import{writeFileSync as Oe}from"fs";function be(e){return e&&e.replace(/\\/g,"/")}function Ee(e,t){if(t.length<2)throw new Error(`${t} is not a valid component file.`);let r=`${t.slice(1)}.svelte`;return be(Q(g,e,"views",r))}function De(e){return e.length<2?e:e.charAt(1).toUpperCase()+e.slice(2).replace("$","")}function Ce(e){if(e.length===0)return e;let t=e.charAt(0).toUpperCase();return e.length===1?t:t+e.slice(1)}function K(...e){return"/"+e.join("/").replace(/\/\/+/g,"/").replace(/^\/|\/$/g,"")}function X(e){let t=[],r=(o,a)=>{if(a.type==="resolver"){if(!Array.isArray(a.url_patterns))return null;a.url_patterns.map(n=>{r({...a},n)})}if(a.type==="pattern"){if(!o||!o.app_path||!o.prefix||typeof a.pattern!="string"||!a.name||a.name[0]!=="$")return null;let n={app:o.app_path,path:o.prefix?K(o.prefix,a.pattern):K(a.pattern),view:a.name??null,component:a.name?Ce(o.app_path)+De(a.name):null,filename:a.name&&o.app_path?Ee(o.app_path,a.name):null};t.push(n)}};return Array.isArray(e)&&(e.map(o=>r(null,o)),Oe(Q(u,"debugRouter.json"),JSON.stringify(t,null,2))),t}import{execSync as Ae}from"child_process";import{readFileSync as Ne,writeFileSync as ke}from"fs";import Z from"path";import{readFileSync as or}from"fs";import{resolve as z}from"path";import{compile as Le}from"svelte/compiler";function R(e,t){return Object.keys(e).forEach(r=>{let o=new RegExp(`{{${r}}}`,"g"),a=new RegExp(`{{!${r}}}`,"g");t=t.replace(o,e[r]),t=t.replace(a,`{{${r}}}`)}),t}function $e(e,t){let r=z(e);return t.find(o=>z(o.sourcefile)===r)??null}function Y(e=[],t){return{name:"virtual-file-injector",setup(r){r.onResolve({filter:/\.vf\.[\S]+$/},async o=>(console.log("VF Resolved: "+o.path),{path:o.path})),r.onLoad({filter:/\.vf\.[\S]+$/},async o=>{let a=$e(o.path,e),n=a.contents,i=a.loader;if(i==="svelte"){let f=Le(n,t)?.js?.code??null;if(!f)throw new Error("Compilation Failed for: "+o.path);return{contents:f,loader:"js"}}return{contents:n,loader:i}})}}}var{__cache:ee,app_name:Ie,cache:Te}=J;function re(){console.log("Getting router...");function e(n,i){let l=new RegExp(`#\\+${i}\\+#([\\s\\S]*?)#\\+${i}\\+#`,"gm"),f=new RegExp("#\\+([\\S]*?)\\+#","gm");return n=n.replace(l,""),n=n.replace(f,""),n}let t;t=process.env.NODE_ENV==="debug"?e(N,"OPERATIONAL"):e(N,"DEBUG"),t=R({app_name:Ie,cache:Te},t);function r(){let n=Z.join(ee,"tmp"),i=Z.join(ee,"routerResolver.json");try{ke(n,t),Ae(`${J.pythonCmd} ${n}`);let l=Ne(i,"utf8");return JSON.parse(l)}catch(l){throw console.error(l),new Error("Could Not Load Django Router Object")}}let o=r();return X(o)}var te="<slot/>";var ne=`<script>\r
  import { currentPathStore, ssrHydrate } from "{{router}}";\r
  {{layoutImportStatement}};\r
  {{svelteComponentImports}};\r
  export let currentRoute;\r
  export let ssrData = {};\r
  ssrHydrate(currentRoute, ssrData)\r
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
`;var oe=`// Import compiled SSR Svelte app.\r
import App from '{{App}}';\r
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
let jsonString = ''\r
let jsonObject = {}\r
\r
try {\r
  jsonString = decodeURIComponent(SSRJSON)\r
  jsonObject = JSON.parse(jsonString)\r
  initialDataPayload[currentRoute] = jsonObject\r
  initialDataPayloadScript = \`<script>\r
  window.initialDataPayload = { route: \\\`\${currentRoute}\\\`, data: JSON.parse(\\\`\${jsonString}\\\`) }\r
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
  currentRoute,\r
  ssrData: jsonObject\r
});\r
\r
const htmlPreload = html + initialDataPayloadScript\r
\r
// Gather the application parts back into an object and serialise them into JSON\r
const outputJSON = JSON.stringify({ head, html: htmlPreload, css });\r
\r
// Pipe the output into the console using the hijacked console\r
__console.log(outputJSON);`;var ae=`// Import compiled CSR Svelte app.\r
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
// Create a new DOM node\r
const container = document.createElement('body');\r
\r
// Mount the application.\r
new App({\r
    target: container,\r
    props: {\r
      currentRoute: clPath(window.location.pathname)\r
    }\r
})\r
\r
// Replace the current document.body with the new DOM node hosting the app\r
document.body.replaceWith(container);`;var se=`import { Writable, writable } from "svelte/store";\r
\r
declare global {\r
  interface Window {\r
    mode?: string;\r
    initialDataPayload?: any;\r
  }\r
}\r
\r
function onlyPath(path: string) {\r
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
export const routes = JSON.parse(\`{{router}}\`) as string[];\r
\r
class ServerDataStore {\r
  storePath: string;\r
  data: Writable<any>;\r
  stale: boolean;\r
  constructor(storePath: string, data: any = {}, stale = true) {\r
    this.storePath = storePath;\r
    this.stale = stale;\r
    const getInitialPayload = () => {\r
      if (\r
        typeof window !== "undefined" &&\r
        typeof window === "object" &&\r
        window.mode !== "ssr" &&\r
        window.initialDataPayload?.route === this.storePath\r
      ) {\r
        const result = {...window.initialDataPayload.data}\r
        delete window.initialDataPayload\r
        return result\r
      } else {\r
        return data\r
      }\r
    }\r
    this.data = writable(getInitialPayload());\r
  }\r
  async fetch() {\r
    try {\r
      const { protocol, hostname, port } = window.location;\r
      const portDefault = protocol === "https:" ? "443" : "80";\r
      const hostnameQualified = \`\${hostname}\${\r
        port && port !== portDefault ? ":" + port : ""\r
      }\`;\r
      const loc = \`\${protocol}//\${hostnameQualified}\${this.storePath}\`;\r
      // Note: CSRF?\r
      const reqOptions = {\r
        method: "DXS",\r
        headers: { "Content-Type": "application/json" },\r
      };\r
      const resultRaw = await fetch(loc, reqOptions);\r
      const resultJson = await resultRaw.json();\r
      this.data.set(resultJson);\r
    console.info("DXS GET Result: ", resultJson);\r
    } catch (err) {\r
      console.error("Server Request Failed - Contact Site Administrator.");\r
    }\r
  }\r
}\r
\r
interface ServerDataStoreType {\r
  [key: string]: ServerDataStore;\r
}\r
\r
export const serverDataStore: ServerDataStoreType = {};\r
\r
export function ssrHydrate(thisPath: string, payload: any) {\r
  if (typeof process !== "undefined" && serverDataStore && serverDataStore[thisPath]) {\r
    serverDataStore[thisPath].data.set(payload)\r
  }\r
}\r
\r
routes.map((route) => {\r
  serverDataStore[route] = new ServerDataStore(route)\r
});\r
\r
function refreshServerStore(store: string) {\r
  if (!serverDataStore[store] ?? serverDataStore[store].stale === false)\r
    return null;\r
  return serverDataStore[store].fetch();\r
}\r
\r
export const goto = (href: string) => {\r
  return async () => {\r
    const thisPath = onlyPath(href);\r
    // Guard clause to navigate to destinations not within the scope of the SPA router\r
    if (!routes.some((route) => thisPath === route)) {\r
      return (window.location.href = href);\r
    }\r
    // Push the href into the history stack and update the stored location\r
    await refreshServerStore(thisPath);\r
    window.history.pushState({}, "", href);\r
    currentPathStore.set(thisPath);\r
  };\r
};\r
\r
if (\r
  typeof window !== "undefined" &&\r
  typeof window === "object" &&\r
  window.mode !== "ssr"\r
) {\r
  // Clean the temporary payload from the DOM\r
  Array.from(document.getElementsByTagName('script')).forEach(script => (script.innerHTML.includes('window.initialDataPayload')) && script.remove())\r
  console.log(routes);\r
  function hrefHandle(e: MouseEvent) {\r
    if (\r
      e?.target &&\r
      e.target instanceof HTMLElement &&\r
      e.target.tagName.toLowerCase() === "a"\r
    ) {\r
      e.preventDefault();\r
      const href = e.target.getAttribute("href");\r
      if (typeof href !== "string") {\r
        return console.error("Invalid Href Attribute");\r
      }\r
      goto(href)();\r
    }\r
  }\r
  document.addEventListener("click", function (e: MouseEvent) {\r
    if (e?.target && e.target instanceof HTMLElement) {\r
      if (e.target.tagName.toLowerCase() === "a") {\r
        hrefHandle(e);\r
      }\r
    }\r
  });\r
  document.addEventListener("keydown", function (e: KeyboardEvent) {\r
    if (\r
      e.key === "Enter" &&\r
      e.target instanceof HTMLElement &&\r
      e.target.tagName.toLowerCase() === "a"\r
    ) {\r
      e.target.click();\r
    }\r
  });\r
}\r
\r
export const data = writable({});\r
\r
currentPathStore.subscribe((currentPath) => {\r
  if (typeof serverDataStore[currentPath] !== 'object') return null\r
  console.log('Updating Data Store: ', currentPath)\r
  data.set(serverDataStore[currentPath].data);\r
});\r
\r
export default { goto, routes, serverDataStore, data, ssrHydrate };\r
`;var ie=`// This is a file which gets generated per module and in the same directory.\r
// It ensures that objects being imported are 'localised' as appropriate.\r
\r
//@ts-ignore\r
import core from \`{{fnameRouter}}\`\r
const route = \`{{path}}\`\r
\r
export const data = {}\r
\r
function mutateObject(source: any, target: any) {\r
    Object.keys(target).forEach(key => delete target[key])\r
    Object.assign(target, source);\r
}\r
\r
core.serverDataStore[route].data.subscribe((update: any) => mutateObject(update, data))`;import{existsSync as Fe}from"fs";function _(e){return e&&e.replace(/\\/g,"/")}import{join as P}from"path";function le(e){let t=[];function r(s,$){let D=s.split("."),A=D[D.length-1],ge={contents:$,sourcefile:s,loader:A};t.push(ge)}let o=_(P(x,"layout.svelte"));Fe(o)||(o=_(P(x,"layout.vf.svelte")),r(o,te));let a=_(P(u,"root.vf.svelte")),n=`import Layout from '${o}'`,i=s=>`import ${s.component} from '${s.filename}'`,l=s=>`{#if currentRoute === '${s.path}'}<${s.component}></${s.component}>{/if}`,f=e.map(s=>i(s)),v=e.map(s=>l(s)),S=f.join(`
`),y=v.join(`
`),m=JSON.stringify(e.map(s=>s.path)),d=_(P(x,"router.vf.ts")),h=R({router:m},se);r(d,h);let w=R({router:d,layoutImportStatement:n,svelteComponentImports:S,svelteComponentsIfs:y},ne),O=s=>{let $={path:s.path,fnameRouter:d},D=R($,ie),A=`${s.filename}.dxs.vf.ts`;r(A,D)};e.map(s=>O(s));let b=R({App:a},oe),E=R({App:a},ae),c=`${_(P(u,"ssr.vf.js"))}`,p=`${_(P(u,"csr.vf.js"))}`;return r(a,w),r(c,b),r(p,E),{vfLoaders:t,entrypointSSRPath:c,entrypointCSRPath:p}}import qe from"esbuild";import{preprocess as Je,compile as Me}from"svelte/compiler";import{dirname as Ue,basename as ce,relative as He}from"path";import{promisify as Be}from"util";import{readFile as Ge,statSync as C}from"fs";var pe=({message:e,start:t,end:r,filename:o,frame:a})=>({text:e,location:t&&r&&{file:o,line:t.line,column:t.column,length:t.line===r.line?r.column-t.column:0,lineText:a}}),ue=e=>e.initialOptions.incremental||e.initialOptions.watch,We=Buffer?e=>Buffer.from(e).toString("base64"):e=>btoa(encodeURIComponent(e));function fe(e){return"data:application/json;charset=utf-8;base64,"+We(e)}var M=/\.svelte$/,me=/\.esbuild-svelte-fake-css$/;function de(e){let t=e?.include??M;return{name:"esbuild-svelte",setup(r){e||(e={}),e.cache==null&&ue(r)&&(e.cache=!0),e.fromEntryFile==null&&(e.fromEntryFile=!1),e.filterWarnings==null&&(e.filterWarnings=()=>!0);let o=new Map,a=new Map;r.onResolve({filter:t},({path:n,kind:i})=>{if(i==="entry-point"&&e?.fromEntryFile)return{path:n,namespace:"esbuild-svelte-direct-import"}}),r.onLoad({filter:t,namespace:"esbuild-svelte-direct-import"},async n=>({errors:[{text:"esbuild-svelte does not support creating entry files yet"}]})),r.onLoad({filter:t},async n=>{var i;let l=null,f=[];if(e?.cache===!0&&a.has(n.path)){l=a.get(n.path)||{dependencies:new Map,data:null};let d=!0;try{l.dependencies.forEach((h,w)=>{C(w).mtime>h&&(d=!1)})}catch{d=!1}if(d)return l.data;a.delete(n.path)}let v=await Be(Ge)(n.path,"utf8"),S=He(process.cwd(),n.path),y=new Map;y.set(n.path,C(n.path).mtime);let m={css:!1,...e?.compilerOptions};try{let d=v;if(e?.preprocess){let c=null;try{c=await Je(v,e.preprocess,{filename:S})}catch(p){throw r.initialOptions.watch&&l&&(f=Array.from(l.dependencies.keys())),p}if(c.map){let p=c.map;for(let s=0;s<p?.sources.length;s++)p.sources[s]==S&&(p.sources[s]=ce(S));m.sourcemap=p}d=c.code,e?.cache===!0&&((i=c.dependencies)==null||i.forEach(p=>{y.set(p,C(p).mtime)}))}let{js:h,css:w,warnings:O}=Me(d,{...m,filename:S});if(m.sourcemap){h.map.sourcesContent==null&&(h.map.sourcesContent=[]);for(let c=0;c<h.map.sources.length;c++)h.map.sources[c]==ce(S)&&(h.map.sourcesContent[c]=v,c=1/0)}let b=h.code+`
//# sourceMappingURL=`+fe(h.map.toString());if((m.css===!1||m.css==="external")&&w.code){let c=n.path.replace(".svelte",".esbuild-svelte-fake-css").replace(/\\/g,"/");o.set(c,w.code+`/*# sourceMappingURL=${fe(w.map.toString())} */`),b=b+`
import "${c}";`}e?.filterWarnings&&(O=O.filter(e.filterWarnings));let E={contents:b,warnings:O.map(pe)};return e?.cache===!0&&a.set(n.path,{data:E,dependencies:y}),r.initialOptions.watch&&(E.watchFiles=Array.from(y.keys())),E}catch(d){return{errors:[pe(d)],watchFiles:f}}}),r.onResolve({filter:me},({path:n})=>({path:n,namespace:"fakecss"})),r.onLoad({filter:me,namespace:"fakecss"},({path:n})=>{let i=o.get(n);return i?{contents:i,loader:"css",resolveDir:Ue(n)}:null}),ue(r)&&e?.cache=="overzealous"&&typeof r.onEnd=="function"&&(r.initialOptions.metafile=!0,r.onEnd(n=>{var i,l,f;for(let v in(i=n.metafile)==null?void 0:i.inputs)if(M.test(v)){let S=(l=n.metafile)==null?void 0:l.inputs[v];(f=S?.imports)==null||f.forEach(y=>{if(M.test(y.path)){let m=a.get(v);m!=null&&(m?.dependencies.set(y.path,C(y.path).mtime),a.set(v,m))}})}}))}}}import{join as U}from"path";import{mkdirSync as Ve}from"fs";function Ke(){return{name:"svelte-data-resolver",setup(e){e.onResolve({filter:/^@dxs$/},t=>{let o=`${_(t.importer)}.dxs.vf.ts`;return console.log("Virtual @dxs: ",o),{path:o}})}}}function H(e,t,r){console.log(r,e);let n=r==="ssr"?{generate:"ssr",dev:!1,hydratable:!0,format:"esm"}:{generate:"dom",dev:!1,format:"esm"};try{Ve(U(g,"static"))}catch{}let i=r==="ssr"?U(x,"svelte.ssr.js"):U(g,"static","svelte.csr.js");return qe.build({entryPoints:[e],mainFields:["svelte","browser","module","main"],bundle:!0,outfile:i,format:"esm",plugins:[Y(t,n),Ke(),de({preprocess:[],compilerOptions:n})]}).catch(()=>{console.error(r==="csr"?"CSR Application Build Failed. Exiting.":"SSR Application Build Failed. Exiting."),process.exit(1)})}T();var he=re(),L=le(he);console.dir(he);await H(L.entrypointCSRPath,L.vfLoaders,"csr");await H(L.entrypointSSRPath,L.vfLoaders,"ssr");F();
//# sourceMappingURL=dxsvelte-compiler.js.map
