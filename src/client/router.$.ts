import { Writable, writable } from "svelte/store";

declare global {
  interface Window {
    mode?: string;
    initialDataPayload?: any;
  }
}

function isLocalURL(url: string): boolean {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return true
  }
  const constructedUrl = new URL(url);
  const currentUrl = new URL(window.location.href);
  return constructedUrl.host === currentUrl.host && constructedUrl.port === currentUrl.port;
}

function getLocalURL(url: string): string {
  const constructedUrl = new URL(url);
  const path = constructedUrl.pathname.slice(1);
  return path ? `/${path}` : '/';
}

export function onlyPath(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    path = getLocalURL(path)
  }
  let queryIndex = path.indexOf("?");
  if (queryIndex !== -1) {
    path = path.slice(0, queryIndex);
  }
  path = path.replace(/^\/|\/$/g, "");
  path = path.replace(/\/{2,}/g, "/");
  path = "/" + path;
  return path;
}

export const activeViewStore = writable({
  route: "/",
  href: "/"
});

// The path as the key and the component is the value. This will be interpolated with a JSON representation of the routes.
interface RoutePathStatic {
  path: string,
  static: boolean
}
export const routes = JSON.parse(`{{strRouterArrayOfObjects}}`) as RoutePathStatic[];

class ServerDataStore {
  storePath: string;
  data: Writable<any>;
  stale: boolean;
  static: boolean;
  constructor(storePath: string, data: any = {}, static_view: boolean = false, stale = true) {
    this.storePath = storePath;
    this.stale = stale;
    this.static = static_view;
    const getInitialPayload = () => {
      if (
        typeof window !== "undefined" &&
        typeof window === "object" &&
        window.mode !== "ssr" &&
        window.initialDataPayload?.route === this.storePath
      ) {
        const result = {...window.initialDataPayload.data}
        delete window.initialDataPayload
        return result
      } else {
        return data
      }
    }
    this.data = writable(getInitialPayload());
  }
  async fetch(target:string|null = null) {
    try {
      const trimmedTarget = onlyPath(target ?? this.storePath)
      const validatedTarget = (this.satisfiedBy(trimmedTarget)) ? trimmedTarget : this.storePath
      const { protocol, hostname, port } = window.location;
      const portDefault = protocol === "https:" ? "443" : "80";
      const hostnameQualified = `${hostname}${
        port && port !== portDefault ? ":" + port : ""
      }`;
      const loc = `${protocol}//${hostnameQualified}${validatedTarget}/`;
      // Note: CSRF?
      const reqOptions = {
        method: "GET",
        headers: { "Content-Type": "application/json", "X-DXS-METHOD": "GET" },
        // headers: { "Content-Type": "application/json" },
      };
      const resultRaw = await fetch(loc, reqOptions);
      const resultJson = await resultRaw.json();
      this.data.set(resultJson);
    // console.info("DXS GET Result: ", resultJson);
    } catch (err) {
      console.error("Server Request Failed - Contact Site Administrator.");
    }
  }
  satisfiedBy(urlPath: string) {
    function trim(str: string) {
      return str.replace(/^\/+|\/+$/g, '');
    }
    const patternPath = /^<path:\w+>$/
    const patternGeneral = /^<\w+:\w+>$/;
    const passedSegments = trim(urlPath).split("/");
    const referencedSegments = trim(this.storePath).split("/"); 
    
    // Handle blanks and return the result immediately
    if (referencedSegments.length === 1 && referencedSegments[0] === "") return (passedSegments.length === 1 && passedSegments[0] === "")
    
    // Initialise the cumulative result
    let result = true
    referencedSegments.map((segment, index) => {
      switch(true) {
        // if it's not a match, just exit to avoid unnecessary checks
        case (result === false):
          break
        // if the passed segment doesn't even contain one with this index number, fail
        case (typeof passedSegments[index] === 'undefined'):
          result = false
          break
        // if the segments are not a verbatim match AND not a normal (non-path) reference segment, fail
        case (segment !== passedSegments[index] && !patternGeneral.test(segment)):
          result = false
          break
        // if the segment is a path but this isn't the last segment, fail
        case (patternPath.test(segment) && index < referencedSegments.length - 1):
          result = false
          break
        // if this is the last segment in the reference but the passed one continues and this isn't a path, fail
        case (index === referencedSegments.length - 1 && passedSegments.length > referencedSegments.length && !patternPath.test(segment)):
          result = false
          break
      }
    })    
    return result
  }
}

interface ServerDataStoreType {
  [key: string]: ServerDataStore;
}

export const serverDataStore: ServerDataStoreType = {};

export function satisfiedStorePath(targetStorePath: string) {
  const fetchedStore = Object.values(serverDataStore).find(dataStore => dataStore.satisfiedBy(targetStorePath))
  if (typeof fetchedStore === 'undefined' || typeof fetchedStore !== 'object') return null
  return fetchedStore.storePath
}

export function getComponentFromTargetPath(targetStorePath: string) {
  const fetchedStore = Object.values(serverDataStore).find(dataStore => dataStore.satisfiedBy(targetStorePath))
  if (typeof fetchedStore === 'undefined' || typeof fetchedStore !== 'object') return null
  return fetchedStore.storePath
}

export function ssrHydrate(thisPath: string, payload: any) {
  if (typeof window === 'undefined' && serverDataStore && serverDataStore[thisPath]) {
    serverDataStore[thisPath].data.set(payload)
  }
}

routes.map((route) => {
  serverDataStore[route.path] = new ServerDataStore(route.path, {}, route.static)
});

function refreshServerStore(targetStorePath: string) {
  const fetchedStore = Object.values(serverDataStore).find(dataStore => dataStore.satisfiedBy(targetStorePath))
  if (typeof fetchedStore === 'undefined' || typeof fetchedStore !== 'object' || fetchedStore.static === true) return null
  return fetchedStore.fetch(targetStorePath);
}

export const goto = (href: string, ignoreHistoryState: boolean = false) => {
  return async () => {
    // Guard clause to navigate to destinations not on the same host
    if (!isLocalURL(href)) {
      return window.location.href = href
    }
    const thisPath = onlyPath(href);
    // Check whether the new route is within the scope of the SPA router
    const validPath = satisfiedStorePath(thisPath)
    if (!validPath) {
      return (window.location.href = href)
    }
    // Push the href into the history stack and update the stored location
    await refreshServerStore(thisPath);
    if (!ignoreHistoryState) window.history.pushState({}, "", href);
    activeViewStore.set({
      route: validPath,
      href: thisPath
    });
  };
};

function isHashChange(url1: string, url2: string): boolean {
  function normaliseUrl (url: string): [string, null|string] {
    const [base, queryString] = url1.split('?');
    const hash = url.split('#')[1];
    const normalisedBase = base.replace(/\/+$/, '');
    let result = normalisedBase
    if (typeof queryString === 'string') {
      result += `?${queryString}`
    }
    if (typeof hash === 'string') {
      result += `#${hash}`
    }
    const hashResult = (typeof hash === 'string') ? hash : null
    return [result, hashResult]
  }
  const normalUrl1 = normaliseUrl(url1)
  const normalUrl2 = normaliseUrl(url2)
  if (normalUrl1[0] === normalUrl2[0] && normalUrl1[1] !== normalUrl2[1]) {
    return true
  }
  return false
}

if (
  typeof window !== "undefined" &&
  typeof window === "object" &&
  window.mode !== "ssr"
) {
  // Clean the temporary payload from the DOM
  Array.from(document.getElementsByTagName('script')).forEach(script => (script.innerHTML.includes('window.initialDataPayload')) && script.remove())
  function hrefHandle(e: MouseEvent) {
    let target = e.target as HTMLElement|null;
    while (target && target.tagName.toLowerCase() !== "a") {
      target = target.parentElement;
    }
    if (!(target && target instanceof HTMLElement)) {
      return null
    }
    // We need to safely handle events where the URL change is only a hash change before proceeding.
    const href = target.getAttribute("href");
    if (typeof href === "string" && isHashChange(href, window.location.href)) {
      return null
      // return console.log("Hash change detected.")
    }
    e.preventDefault();
    if (typeof href !== "string") {
      return console.error("Invalid Href Attribute");
    }
    goto(href)();
  }
  document.addEventListener("click", function (e: MouseEvent) {
    hrefHandle(e)
  });
  document.addEventListener("keydown", function (e: KeyboardEvent) {
    if (
      e.key === "Enter" &&
      e.target instanceof HTMLElement &&
      e.target.tagName.toLowerCase() === "a"
    ) {
      e.target.click();
    }
  });
  window.addEventListener('popstate', (event: PopStateEvent) => {
    event.preventDefault();
    const navTo = (event.target as Window)?.location?.href ?? '';
    goto(navTo, true)();
  });
}

// data alias used only for SSR
export const data = writable({});

export default { goto, routes, serverDataStore, data, ssrHydrate };
