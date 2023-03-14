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
#+DEBUG+#`;import{join as Re}from"path";import{existsSync as M,mkdirSync as me,readdirSync as B,readFileSync as fe,rmSync as de,unlinkSync as G}from"fs";import{join as O,resolve as he}from"path";import*as $ from"url";var k="__svcache__",ge="python",h=he(process.cwd()),ve=$.fileURLToPath(import.meta.url),_e=$.fileURLToPath(new URL(".",import.meta.url)),m=O(h,k),Se=M(O(h,"manage.py"));Se||(console.error("This script must be run from the Django project's root directory. Exiting."),process.exit(1));console.log(`${h} is a Django project directory. Continuing.`);var ye=W(),H=W(),y=O(h,H);function W(){let e=/os\.environ\.setdefault\(\s*(['\"`])DJANGO_SETTINGS_MODULE\1\s*,\s*\s*(['\"`])(.+?)\2\s*\)/,t=fe(O(h,"manage.py"),"utf8").match(e)??[],o=t?.length>3?t[3]:"";if(o==="")throw new Error("Could not extract settings from manage.py. Exiting.");return o.split(".")[0]}function I(){M(m)?B(m).forEach(r=>{let t=O(m,r);G(t)}):me(m,{recursive:!0})}function N(){B(m).forEach(r=>{let t=O(m,r);G(t)}),de(m,{recursive:!0,force:!0}),console.log(`Cleaned ${k} artefacts.`)}var F={app_name:ye,cache:k,pythonCmd:ge,__basedir:h,__filename:ve,__dirname:_e,__cache:m,__main:H,__maindir:y,prepareSvCache:I,cleanSvCache:N};function xe(e){return e&&e.replace(/\\/g,"/")}function je(e,r){if(r.length<2)throw new Error(`${r} is not a valid component file.`);let t=`${r.slice(1)}.svelte`;return xe(Re(h,e,"views",t))}function we(e){return e.length<2?e:e.charAt(1).toUpperCase()+e.slice(2).replace("$","")}function Oe(e){if(e.length===0)return e;let r=e.charAt(0).toUpperCase();return e.length===1?r:r+e.slice(1)}function Pe(...e){return"/"+e.join("/").replace(/\/\/+/g,"/").replace(/^\/|\/$/g,"")}function q(e){let r=[],t=(o,s)=>{if(s.type==="resolver"){if(!Array.isArray(s.url_patterns))return null;s.url_patterns.map(n=>{t({...s},n)})}if(s.type==="pattern"){if(!o||!o.app_path||!o.prefix||typeof s.pattern!="string"||!s.name||s.name[0]!=="$")return null;let n={app:o.app_path,path:Pe(o.prefix,s.pattern),view:s.name??null,component:s.name?Oe(o.app_path)+we(s.name):null,filename:s.name&&o.app_path?je(o.app_path,s.name):null};r.push(n)}};return Array.isArray(e)&&e.map(o=>t(null,o)),r}import{execSync as Le}from"child_process";import{readFileSync as be,writeFileSync as Ae}from"fs";import K from"path";import{readFileSync as Ze}from"fs";import{resolve as V}from"path";import{compile as Ce}from"svelte/compiler";function R(e,r){return Object.keys(e).forEach(t=>{let o=new RegExp(`{{${t}}}`,"g");r=r.replace(o,e[t])}),r}function Ee(e,r){let t=V(e);return r.find(o=>V(o.sourcefile)===t)??null}function z(e=[],r){return{name:"virtual-file-injector",setup(t){t.onResolve({filter:/\.vf\.[\S]+$/},async o=>(console.log("VF Resolved: "+o.path),{path:o.path})),t.onLoad({filter:/\.vf\.[\S]+$/},async o=>{let s=Ee(o.path,e),n=s.contents,a=s.loader;if(a==="svelte"){let c=Ce(n,r)?.js?.code??null;if(!c)throw new Error("Compilation Failed for: "+o.path);return{contents:c,loader:"js"}}return{contents:n,loader:a}})}}}var{__cache:Q,app_name:$e,cache:ke}=F;function X(){console.log("Getting router...");function e(n,a){let l=new RegExp(`#\\+${a}\\+#([\\s\\S]*?)#\\+${a}\\+#`,"gm"),c=new RegExp("#\\+([\\S]*?)\\+#","gm");return n=n.replace(l,""),n=n.replace(c,""),n}let r;r=process.env.NODE_ENV==="debug"?e(A,"OPERATIONAL"):e(A,"DEBUG"),r=R({app_name:$e,cache:ke},r);function t(){let n=K.join(Q,"tmp"),a=K.join(Q,"routerResolver.json");try{Ae(n,r),Le(`${F.pythonCmd} ${n}`);let l=be(a,"utf8");return JSON.parse(l)}catch(l){throw console.error(l),new Error("Could Not Load Django Router Object")}}let o=t();return q(o)}var Y="<body><slot/></body>";var Z=`<script>\r
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
`;var ee=`// Import compiled SSR Svelte app.\r
import App from '{{App}}';\r
\r
// Janky temporary workaround to avoid unneeded stdio outputs\r
const SSRPATH = process.argv[2];\r
const __console = console;\r
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
  currentRoute: SSRPATH ?? "/",\r
});\r
\r
// Gather the application parts back into an object and serialise them into JSON\r
const outputJSON = JSON.stringify({ head, html, css });\r
\r
// Pipe the output into the console using the hijacked console\r
__console.log(outputJSON);`;var te=`// Import compiled CSR Svelte app.\r
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
})`;var re=`import { writable } from 'svelte/store';\r
\r
function onlyPath(path) {\r
  let queryIndex = path.indexOf('?');\r
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
// Define your routes as an object with the path as the key and the component as the value\r
export const routes = JSON.parse(\`{{router}}\`)\r
// export const routes = routesImported.map(route => route = onlyPath(route));\r
\r
export const goto = (href) => {\r
  return () => {\r
    // Guard clause to navigate to destinations not within the scope of the SPA router\r
    if (!routes.some(route => onlyPath(href) === route)) {\r
      return window.location.href = href\r
    }\r
    // Push the href into the history stack and update the stored location\r
    window.history.pushState({}, "", href)\r
    currentPathStore.set(onlyPath(href))\r
  }\r
}\r
\r
if (typeof window !== 'undefined') {\r
  function hrefHandle(e) {\r
    if (e.target.tagName.toLowerCase() === "a") {\r
      e.preventDefault()\r
      const href = e.target.getAttribute("href")\r
      if (typeof href !== "string") {\r
        return console.error('Invalid Href Attribute')\r
      }\r
      goto(href)()\r
    }\r
  }\r
  document.addEventListener("click", function (e) {\r
    if (e.target.tagName.toLowerCase() === "a") {\r
      hrefHandle(e)\r
    }\r
  });\r
  document.addEventListener("keydown", function (e) {\r
    if (e.keyCode === 13 && e.target.tagName.toLowerCase() === "a") {\r
      e.target.click()\r
    }\r
  });\r
}\r
\r
export default { routes, goto }`;import{existsSync as Ie}from"fs";function x(e){return e&&e.replace(/\\/g,"/")}import{join as P}from"path";function ne(e){let r=[];function t(i,w){let T=i.split("."),ce=T[T.length-1],ue={contents:w,sourcefile:i,loader:ce};r.push(ue)}let o=x(P(y,"layout.svelte"));Ie(o)||(o=x(P(y,"layout.vf.svelte")),t(o,Y));let s=x(P(m,"root.vf.svelte")),n=`import Layout from '${o}'`,a=i=>`import ${i.component} from '${i.filename}'`,l=i=>`{#if currentRoute === '${i.path}'}<${i.component}></${i.component}>{/if}`,c=e.map(i=>a(i)),g=e.map(i=>l(i)),v=c.join(`
`),_=g.join(`
`),u=JSON.stringify(e.map(i=>i.path)),f=x(P(y,"router.vf.js")),d=R({router:u},re);t(f,d);let S=R({router:f,layoutImportStatement:n,svelteComponentImports:v,svelteComponentsIfs:_},Z),C=R({App:s},ee),E=R({App:s},te),j=`${x(P(m,"ssr.vf.js"))}`,p=`${x(P(m,"csr.vf.js"))}`;return t(s,S),t(j,C),t(p,E),{vfLoaders:r,entrypointSSRPath:j,entrypointCSRPath:p}}import Be from"esbuild";import{preprocess as Ne,compile as Fe}from"svelte/compiler";import{dirname as De,basename as oe,relative as Ue}from"path";import{promisify as Je}from"util";import{readFile as Te,statSync as L}from"fs";var se=({message:e,start:r,end:t,filename:o,frame:s})=>({text:e,location:r&&t&&{file:o,line:r.line,column:r.column,length:r.line===t.line?t.column-r.column:0,lineText:s}}),ie=e=>e.initialOptions.incremental||e.initialOptions.watch,Me=Buffer?e=>Buffer.from(e).toString("base64"):e=>btoa(encodeURIComponent(e));function ae(e){return"data:application/json;charset=utf-8;base64,"+Me(e)}var D=/\.svelte$/,le=/\.esbuild-svelte-fake-css$/;function pe(e){let r=e?.include??D;return{name:"esbuild-svelte",setup(t){e||(e={}),e.cache==null&&ie(t)&&(e.cache=!0),e.fromEntryFile==null&&(e.fromEntryFile=!1),e.filterWarnings==null&&(e.filterWarnings=()=>!0);let o=new Map,s=new Map;t.onResolve({filter:r},({path:n,kind:a})=>{if(a==="entry-point"&&e?.fromEntryFile)return{path:n,namespace:"esbuild-svelte-direct-import"}}),t.onLoad({filter:r,namespace:"esbuild-svelte-direct-import"},async n=>({errors:[{text:"esbuild-svelte does not support creating entry files yet"}]})),t.onLoad({filter:r},async n=>{var a;let l=null,c=[];if(e?.cache===!0&&s.has(n.path)){l=s.get(n.path)||{dependencies:new Map,data:null};let f=!0;try{l.dependencies.forEach((d,S)=>{L(S).mtime>d&&(f=!1)})}catch{f=!1}if(f)return l.data;s.delete(n.path)}let g=await Je(Te)(n.path,"utf8"),v=Ue(process.cwd(),n.path),_=new Map;_.set(n.path,L(n.path).mtime);let u={css:!1,...e?.compilerOptions};try{let f=g;if(e?.preprocess){let p=null;try{p=await Ne(g,e.preprocess,{filename:v})}catch(i){throw t.initialOptions.watch&&l&&(c=Array.from(l.dependencies.keys())),i}if(p.map){let i=p.map;for(let w=0;w<i?.sources.length;w++)i.sources[w]==v&&(i.sources[w]=oe(v));u.sourcemap=i}f=p.code,e?.cache===!0&&((a=p.dependencies)==null||a.forEach(i=>{_.set(i,L(i).mtime)}))}let{js:d,css:S,warnings:C}=Fe(f,{...u,filename:v});if(u.sourcemap){d.map.sourcesContent==null&&(d.map.sourcesContent=[]);for(let p=0;p<d.map.sources.length;p++)d.map.sources[p]==oe(v)&&(d.map.sourcesContent[p]=g,p=1/0)}let E=d.code+`
//# sourceMappingURL=`+ae(d.map.toString());if((u.css===!1||u.css==="external")&&S.code){let p=n.path.replace(".svelte",".esbuild-svelte-fake-css").replace(/\\/g,"/");o.set(p,S.code+`/*# sourceMappingURL=${ae(S.map.toString())} */`),E=E+`
import "${p}";`}e?.filterWarnings&&(C=C.filter(e.filterWarnings));let j={contents:E,warnings:C.map(se)};return e?.cache===!0&&s.set(n.path,{data:j,dependencies:_}),t.initialOptions.watch&&(j.watchFiles=Array.from(_.keys())),j}catch(f){return{errors:[se(f)],watchFiles:c}}}),t.onResolve({filter:le},({path:n})=>({path:n,namespace:"fakecss"})),t.onLoad({filter:le,namespace:"fakecss"},({path:n})=>{let a=o.get(n);return a?{contents:a,loader:"css",resolveDir:De(n)}:null}),ie(t)&&e?.cache=="overzealous"&&typeof t.onEnd=="function"&&(t.initialOptions.metafile=!0,t.onEnd(n=>{var a,l,c;for(let g in(a=n.metafile)==null?void 0:a.inputs)if(D.test(g)){let v=(l=n.metafile)==null?void 0:l.inputs[g];(c=v?.imports)==null||c.forEach(_=>{if(D.test(_.path)){let u=s.get(g);u!=null&&(u?.dependencies.set(_.path,L(_.path).mtime),s.set(g,u))}})}}))}}}import{join as U}from"path";import{mkdirSync as Ge}from"fs";function J(e,r,t){console.log(t,e);let n=t==="ssr"?{generate:"ssr",dev:!1,hydratable:!0,format:"esm"}:{generate:"dom",dev:!1,format:"esm"};try{Ge(U(h,"static"))}catch{}let a=t==="ssr"?U(y,"svelte.ssr.js"):U(h,"static","svelte.csr.js");return Be.build({entryPoints:[e],mainFields:["svelte","browser","module","main"],bundle:!0,outfile:a,format:"esm",plugins:[z(r,n),pe({preprocess:[],compilerOptions:n})]}).catch(()=>{console.error(t==="csr"?"CSR Application Build Failed. Exiting.":"SSR Application Build Failed. Exiting."),process.exit(1)})}I();var He=X(),b=ne(He);await J(b.entrypointCSRPath,b.vfLoaders,"csr");await J(b.entrypointSSRPath,b.vfLoaders,"ssr");N();
//# sourceMappingURL=dxsvelte-compiler.js.map
