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

export const currentPathStore = writable("/");

// The path as the key and the component is the value. This will be interpolated with a JSON representation of the routes.
export const routes = JSON.parse(`{{router}}`) as string[];

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
  async fetch() {
    try {
      const { protocol, hostname, port } = window.location;
      const portDefault = protocol === "https:" ? "443" : "80";
      const hostnameQualified = `${hostname}${
        port && port !== portDefault ? ":" + port : ""
      }`;
      const loc = `${protocol}//${hostnameQualified}${this.storePath}`;
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
}

interface ServerDataStoreType {
  [key: string]: ServerDataStore;
}

export const serverDataStore: ServerDataStoreType = {};

export function ssrHydrate(thisPath: string, payload: any) {
  if (typeof process !== "undefined" && serverDataStore && serverDataStore[thisPath]) {
    serverDataStore[thisPath].data.set(payload)
  }
}

routes.map((route) => {
  serverDataStore[route] = new ServerDataStore(route)
});

function refreshServerStore(store: string) {
  if (!serverDataStore[store] ?? serverDataStore[store].stale === false)
    return null;
  return serverDataStore[store].fetch();
}

export const goto = (href: string) => {
  return async () => {
    const thisPath = onlyPath(href);
    // Guard clause to navigate to destinations not within the scope of the SPA router
    if (!routes.some((route) => thisPath === route)) {
      return (window.location.href = href);
    }
    // Push the href into the history stack and update the stored location
    await refreshServerStore(thisPath);
    window.history.pushState({}, "", href);
    currentPathStore.set(thisPath);
  };
};

if (
  typeof window !== "undefined" &&
  typeof window === "object" &&
  window.mode !== "ssr"
) {
  // Clean the temporary payload from the DOM
  Array.from(document.getElementsByTagName('script')).forEach(script => (script.innerHTML.includes('window.initialDataPayload')) && script.remove())
  console.log(routes);
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

export const data = writable({});

currentPathStore.subscribe((currentPath) => {
  if (typeof serverDataStore[currentPath] !== 'object') return null
  console.log('Updating Data Store: ', currentPath)
  data.set(serverDataStore[currentPath].data);
});

export default { goto, routes, serverDataStore, data, ssrHydrate };
