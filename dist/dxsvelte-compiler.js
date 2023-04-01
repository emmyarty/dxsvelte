#!/usr/bin/env node

var C=`#!/usr/bin/python3\r
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
#+DEBUG+#`;import{join as q}from"path";import{existsSync as M,mkdirSync as lt,readdirSync as H,readFileSync as pt,rmSync as ct,unlinkSync as U}from"fs";import{join as g,resolve as ut}from"path";import*as E from"url";var L="__svcache__",ft="python",l=ut(process.cwd()),mt=E.fileURLToPath(import.meta.url),dt=E.fileURLToPath(new URL(".",import.meta.url)),i=g(l,L),ht=M(g(l,"manage.py"));ht||(console.error("This script must be run from the Django project's root directory. Exiting."),process.exit(1));console.log(`${l} is a Django project directory. Continuing.`);var gt=B(),V=B(),h=g(l,V);function B(){let t=/os\.environ\.setdefault\(\s*(['\"`])DJANGO_SETTINGS_MODULE\1\s*,\s*\s*(['\"`])(.+?)\2\s*\)/,e=pt(g(l,"manage.py"),"utf8").match(t)??[],n=e?.length>3?e[3]:"";if(n==="")throw new Error("Could not extract settings from manage.py. Exiting.");return n.split(".")[0]}function $(){M(i)?H(i).forEach(r=>{let e=g(i,r);U(e)}):lt(i,{recursive:!0})}function St(){H(i).forEach(r=>{let e=g(i,r);U(e)}),ct(i,{recursive:!0,force:!0}),console.log(`Cleaned ${L} artefacts.`)}var N={app_name:gt,cache:L,pythonCmd:ft,__basedir:l,__filename:mt,__dirname:dt,__cache:i,__main:V,__maindir:h,prepareSvCache:$,cleanSvCache:St};import{writeFileSync as vt}from"fs";function yt(t){return t&&t.replace(/\\/g,"/")}function wt(t,r){if(r.length<2)throw new Error(`${r} is not a valid component file.`);let e=`${r.slice(1)}.svelte`;return yt(q(l,t,"views",e))}function _t(t){return t.length<2?t:t.charAt(1).toUpperCase()+t.slice(2).replace("$","")}function Pt(t){if(t.length===0)return t;let r=t.charAt(0).toUpperCase();return t.length===1?r:r+t.slice(1)}function G(...t){return"/"+t.join("/").replace(/\/\/+/g,"/").replace(/^\/|\/$/g,"")}function W(t){let r=[],e=(n,o)=>{if(o.type==="resolver"){if(!Array.isArray(o.url_patterns))return null;o.url_patterns.map(s=>{e({...o},s)})}if(o.type==="pattern"){if(!n||!n.app_path||!n.prefix||typeof o.pattern!="string"||!o.name||o.name[0]!=="$")return null;let s={app:n.app_path,path:n.prefix?G(n.prefix,o.pattern):G(o.pattern),view:o.name??null,component:o.name?Pt(n.app_path)+_t(o.name):null,filename:o.name&&n.app_path?wt(n.app_path,o.name):null};r.push(s)}};return Array.isArray(t)&&(t.map(n=>e(null,n)),vt(q(i,"debugRouter.json"),JSON.stringify(r,null,2))),r}import{execSync as Rt}from"child_process";import{readFileSync as bt,writeFileSync as Ot}from"fs";import K from"path";import{readFileSync as qt}from"fs";import{resolve as Q}from"path";import{compile as xt}from"svelte/compiler";function d(t,r){return Object.keys(t).forEach(e=>{let n=new RegExp(`{{${e}}}`,"g"),o=new RegExp(`{{!${e}}}`,"g");r=r.replace(n,t[e]),r=r.replace(o,`{{${e}}}`)}),r}function jt(t,r){let e=Q(t);return r.find(n=>Q(n.sourcefile)===e)??null}function X(t=[],r){return{name:"virtual-file-injector",setup(e){e.onResolve({filter:/\.vf\.[\S]+$/},async n=>(console.log("VF Resolved: "+n.path),{path:n.path})),e.onLoad({filter:/\.vf\.[\S]+$/},async n=>{let o=jt(n.path,t),s=o.contents,p=o.loader;if(p==="svelte"){let u=xt(s,r)?.js?.code??null;if(!u)throw new Error("Compilation Failed for: "+n.path);return{contents:u,loader:"js"}}return{contents:s,loader:p}})}}}var{__cache:z,app_name:Dt,cache:Ct}=N;function Y(){console.log("Getting router...");function t(s,p){let c=new RegExp(`#\\+${p}\\+#([\\s\\S]*?)#\\+${p}\\+#`,"gm"),u=new RegExp("#\\+([\\S]*?)\\+#","gm");return s=s.replace(c,""),s=s.replace(u,""),s}let r;r=process.env.NODE_ENV==="debug"?t(C,"OPERATIONAL"):t(C,"DEBUG"),r=d({app_name:Dt,cache:Ct},r);function e(){let s=K.join(z,"tmp"),p=K.join(z,"routerResolver.json");try{Ot(s,r),Rt(`${N.pythonCmd} ${s}`);let c=bt(p,"utf8");return JSON.parse(c)}catch(c){throw console.error(c),new Error("Could Not Load Django Router Object")}}let n=e();return W(n)}var Z="<slot/>";var tt=`<script>\r
  import { activeViewStore, ssrHydrate, satisfiedStorePath } from "{{router}}";\r
  import { writable } from "svelte/store";\r
  {{layoutImportStatement}};\r
  {{svelteComponentImports}};\r
  // {{svelteComponentMap}}\r
  export let ssrData = {};\r
  export let currentView;\r
  export let currentHref = currentView;\r
  let trigger = [null]\r
\r
  ssrHydrate(currentView, ssrData);\r
  activeViewStore.set({route: currentView, href: currentHref});\r
  activeViewStore.subscribe((value) => {\r
    if (typeof window !== "undefined") {\r
      console.log('Root component updating to: ', value)\r
    }\r
    const reload = (currentHref !== value.href)\r
    currentView = value.route;\r
    currentHref = value.href;\r
    if (reload) { trigger = [null] }\r
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
// Janky temporary workaround to avoid unneeded stdio outputs\r
const SSRPATH = process.argv[2];\r
const SSRJSON = process.argv[3];\r
\r
// const writer = process.stdout.write\r
// process.stdout.write = () => null\r
const __console = console;\r
\r
const currentView = SSRPATH ?? "/"\r
\r
let initialDataPayload = {}\r
let initialDataPayloadScript = ''\r
let jsonString = ''\r
let jsonObject = {}\r
\r
try {\r
  jsonString = decodeURIComponent(SSRJSON)\r
  jsonObject = JSON.parse(jsonString)\r
  initialDataPayload[currentView] = jsonObject\r
  initialDataPayloadScript = \`<script>\r
  window.initialDataPayload = { route: \\\`\${currentView}\\\`, data: JSON.parse(\\\`\${jsonString}\\\`) }\r
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
  currentView,\r
  ssrData: jsonObject\r
});\r
\r
const htmlPreload = html + initialDataPayloadScript\r
\r
// Gather the application parts back into an object and serialise them into JSON\r
const outputJSON = JSON.stringify({ head, html: htmlPreload, css });\r
\r
// Pipe the output into the console using the hijacked console\r
__console.log(outputJSON);`;var et=`// Import compiled CSR Svelte app.\r
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
      currentView: clPath(window.location.pathname)\r
    }\r
})\r
\r
// Replace the current document.body with the new DOM node hosting the app\r
document.body.replaceWith(container);`;var nt=`import { Writable, writable } from "svelte/store";\r
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
export const activeViewStore = writable({\r
  route: "/",\r
  href: "/"\r
});\r
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
  async fetch(target:string|null = null) {\r
    try {\r
      const trimmedTarget = onlyPath(target ?? this.storePath)\r
      const validatedTarget = (this.satisfiedBy(trimmedTarget)) ? trimmedTarget : this.storePath\r
      const { protocol, hostname, port } = window.location;\r
      const portDefault = protocol === "https:" ? "443" : "80";\r
      const hostnameQualified = \`\${hostname}\${\r
        port && port !== portDefault ? ":" + port : ""\r
      }\`;\r
      const loc = \`\${protocol}//\${hostnameQualified}\${validatedTarget}\`;\r
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
  satisfiedBy(urlPath: string) {\r
    function trim(str: string) {\r
      return str.replace(/^\\/+|\\/+$/g, '');\r
    }\r
    const patternPath = /^<path:\\w+>$/\r
    const patternGeneral = /^<\\w+:\\w+>$/;\r
    const passedSegments = trim(urlPath).split("/");\r
    const referencedSegments = trim(this.storePath).split("/"); \r
    \r
    // Handle blanks and return the result immediately\r
    if (referencedSegments.length === 1 && referencedSegments[0] === "") return (passedSegments.length === 1 && passedSegments[0] === "")\r
    \r
    // Initialise the cumulative result\r
    let result = true\r
    referencedSegments.map((segment, index) => {\r
      switch(true) {\r
        // if it's not a match, just exit to avoid unnecessary checks\r
        case (result === false):\r
          break\r
        // if the passed segment doesn't even contain one with this index number, fail\r
        case (typeof passedSegments[index] === 'undefined'):\r
          result = false\r
          break\r
        // if the segments are not a verbatim match AND not a normal (non-path) reference segment, fail\r
        case (segment !== passedSegments[index] && !patternGeneral.test(segment)):\r
          result = false\r
          break\r
        // if the segment is a path but this isn't the last segment, fail\r
        case (patternPath.test(segment) && index < referencedSegments.length - 1):\r
          result = false\r
          break\r
        // if this is the last segment in the reference but the passed one continues and this isn't a path, fail\r
        case (index === referencedSegments.length - 1 && passedSegments.length > referencedSegments.length && !patternPath.test(segment)):\r
          result = false\r
          break\r
      }\r
    })    \r
    return result\r
  }\r
}\r
\r
interface ServerDataStoreType {\r
  [key: string]: ServerDataStore;\r
}\r
\r
export const serverDataStore: ServerDataStoreType = {};\r
\r
export function satisfiedStorePath(targetStorePath: string) {\r
  const fetchedStore = Object.values(serverDataStore).find(dataStore => dataStore.satisfiedBy(targetStorePath))\r
  if (typeof fetchedStore === 'undefined' || typeof fetchedStore !== 'object') return null\r
  return fetchedStore.storePath\r
}\r
\r
export function getComponentFromTargetPath(targetStorePath: string) {\r
  const fetchedStore = Object.values(serverDataStore).find(dataStore => dataStore.satisfiedBy(targetStorePath))\r
  if (typeof fetchedStore === 'undefined' || typeof fetchedStore !== 'object') return null\r
  return fetchedStore.storePath\r
}\r
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
function refreshServerStore(targetStorePath: string) {\r
  const fetchedStore = Object.values(serverDataStore).find(dataStore => dataStore.satisfiedBy(targetStorePath))\r
  if (typeof fetchedStore === 'undefined' || typeof fetchedStore !== 'object') return null\r
  return fetchedStore.fetch(targetStorePath);\r
}\r
\r
export const goto = (href: string) => {\r
  return async () => {\r
    const thisPath = onlyPath(href);\r
    // Guard clause to navigate to destinations not within the scope of the SPA router\r
    const validPath = satisfiedStorePath(thisPath)\r
    if (!validPath) {\r
      return (window.location.href = href)\r
    }\r
    // Push the href into the history stack and update the stored location\r
    await refreshServerStore(thisPath);\r
    window.history.pushState({}, "", href);\r
    activeViewStore.set({\r
      route: validPath,\r
      href: thisPath\r
    });\r
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
// data alias used only for SSR\r
export const data = writable({});\r
\r
export default { goto, routes, serverDataStore, data, ssrHydrate };\r
`;var ot=`// This is a file which gets generated per module and in the same directory.\r
// It ensures that objects being imported are 'localised' as appropriate.\r
\r
//@ts-ignore\r
import core from \`{{fnameRouter}}\`\r
const route = \`{{path}}\`\r
\r
export const ServerSideProps = core.serverDataStore[route].data\r
\r
export default { ServerSideProps }`;import{existsSync as Et}from"fs";function f(t){return t&&t.replace(/\\/g,"/")}import{join as S}from"path";function st(t){let r=[];function e(a,O){let P=a.split("."),D=P[P.length-1],it={contents:O,sourcefile:a,loader:D};r.push(it)}let n=f(S(h,"layout.svelte"));Et(n)||(n=f(S(h,"layout.vf.svelte")),e(n,Z));let o=f(S(i,"root.vf.svelte")),s=`import Layout from '${n}'`,p=a=>`import ${a.component} from '${a.filename}'`,c=a=>`{#each trigger as instance}{#if satisfiedStorePath(currentView) === '${a.path}'}<${a.component}></${a.component}>{/if}{/each}`,u=t.map(a=>p(a)),R=t.map(a=>c(a)),k=u.join(`
`),b=R.join(`
`),m=JSON.stringify(t.map(a=>a.path)),w=f(S(h,"router.vf.ts")),T=d({router:m},nt);e(w,T);let _=d({router:w,layoutImportStatement:s,svelteComponentImports:k,svelteComponentsIfs:b},tt),I=a=>{let O={path:a.path,fnameRouter:w},P=d(O,ot),D=`${a.filename}.dxs.vf.ts`;e(D,P)};t.map(a=>I(a));let v=d({App:o},rt),y=d({App:o},et),J=`${f(S(i,"ssr.vf.js"))}`,F=`${f(S(i,"csr.vf.js"))}`;return e(o,_),e(J,v),e(F,y),{vfLoaders:r,entrypointSSRPath:J,entrypointCSRPath:F}}import Lt from"esbuild";import $t from"esbuild-svelte";import{join as x}from"path";import{mkdirSync as Nt,existsSync as At}from"fs";import{pathToFileURL as kt}from"url";function Tt(){return{name:"svelte-data-resolver",setup(t){t.onResolve({filter:/^@dxs$/},r=>{let n=`${f(r.importer)}.dxs.vf.ts`;return console.log("Virtual @dxs: ",n),{path:n}})}}}async function A(t,r,e){console.log("Compiling...",e,t);let s=e==="ssr"?{generate:"ssr",dev:!1,hydratable:!0,format:"esm",css:!0}:{generate:"dom",dev:!1,format:"esm"};try{Nt(x(l,"static"))}catch{}let p=e==="ssr"?x(h,"svelte.ssr.js"):x(l,"static","svelte.csr.js");async function c(m){let _=[m+".js",m+".mjs",m+".cjs"].map(y=>x(l,y)).find(y=>At(y));if(!_)return[];let v=await import(kt(_).toString());if(typeof v<"u")return console.log("Loaded "+m),console.log(v),v}let u=e==="ssr"?{preprocess:[]}:await c("svelte.config"),R=u?.preprocess?u.preprocess:[],k=!0,b=[X(r,s),Tt(),$t({preprocess:R,compilerOptions:s})];return Lt.build({entryPoints:[t],mainFields:["svelte","browser","module","main"],bundle:!0,outfile:p,format:"esm",plugins:b}).catch(()=>{console.error(e==="csr"?"CSR Application Build Failed. Exiting.":"SSR Application Build Failed. Exiting."),process.exit(1)})}$();var at=Y(),j=st(at);console.dir(at);await A(j.entrypointCSRPath,j.vfLoaders,"csr");await A(j.entrypointSSRPath,j.vfLoaders,"ssr");
//# sourceMappingURL=dxsvelte-compiler.js.map
