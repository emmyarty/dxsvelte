import { Writable, writable } from "svelte/store";

declare global {
  interface Window {
    mode?: string;
    initialDataPayload?: any;
  }
}

function onlyPath(path: string) {
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
export const routes = JSON.parse(`{{router}}`) as string[];

// We need to create a series of functions which will evaluate paths against the router as well as reconstruct them from the patterns.
function pathConstructor() {

}

function pathMatcher() {

}

class ServerDataStore {
  storePath: string;
  data: Writable<any>;
  stale: boolean;
  constructor(storePath: string, data: any = {}, stale = true) {
    this.storePath = storePath;
    this.stale = stale;
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
      const loc = `${protocol}//${hostnameQualified}${validatedTarget}`;
      // Note: CSRF?
      const reqOptions = {
        method: "DXS",
        headers: { "Content-Type": "application/json" },
      };
      const resultRaw = await fetch(loc, reqOptions);
      const resultJson = await resultRaw.json();
      this.data.set(resultJson);
    console.info("DXS GET Result: ", resultJson);
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
    type DjangoParamTypes = 'str'|'int'|'slug'|'uuid'|'path';
    interface DjangoParams {
      str: string
      int: number
      slug: string
      uuid: string
      path: string
    }
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
  if (typeof process !== "undefined" && serverDataStore && serverDataStore[thisPath]) {
    serverDataStore[thisPath].data.set(payload)
  }
}

routes.map((route) => {
  serverDataStore[route] = new ServerDataStore(route)
});

function refreshServerStore(targetStorePath: string) {
  const fetchedStore = Object.values(serverDataStore).find(dataStore => dataStore.satisfiedBy(targetStorePath))
  if (typeof fetchedStore === 'undefined' || typeof fetchedStore !== 'object') return null
  return fetchedStore.fetch(targetStorePath);
}

export const goto = (href: string) => {
  return async () => {
    const thisPath = onlyPath(href);
    // Guard clause to navigate to destinations not within the scope of the SPA router
    const validPath = satisfiedStorePath(thisPath)
    if (!validPath) {
      return (window.location.href = href)
    }
    // Push the href into the history stack and update the stored location
    await refreshServerStore(thisPath);
    window.history.pushState({}, "", href);
    activeViewStore.set({
      route: validPath,
      href: thisPath
    });
    // activeViewStore.update(value => value)
  };
};

if (
  typeof window !== "undefined" &&
  typeof window === "object" &&
  window.mode !== "ssr"
) {
  // Clean the temporary payload from the DOM
  Array.from(document.getElementsByTagName('script')).forEach(script => (script.innerHTML.includes('window.initialDataPayload')) && script.remove())
  function hrefHandle(e: MouseEvent) {
    if (
      e?.target &&
      e.target instanceof HTMLElement &&
      e.target.tagName.toLowerCase() === "a"
    ) {
      e.preventDefault();
      const href = e.target.getAttribute("href");
      if (typeof href !== "string") {
        return console.error("Invalid Href Attribute");
      }
      goto(href)();
    }
  }
  document.addEventListener("click", function (e: MouseEvent) {
    if (e?.target && e.target instanceof HTMLElement) {
      if (e.target.tagName.toLowerCase() === "a") {
        hrefHandle(e);
      }
    }
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
}

// data alias used only for SSR
export const data = writable({});

export default { goto, routes, serverDataStore, data, ssrHydrate };
