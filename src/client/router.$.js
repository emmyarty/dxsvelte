import { writable } from "svelte/store";

function onlyPath(path) {
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
export const routes = JSON.parse(`{{router}}`);

export const serverDataStore = {};

class ServerDataStore {
  constructor(
    opts = { storePath: string, stale: true, data: {} }
  ) {
    this.storePath = opts.storePath;
    // Currently no way of setting this
    this.stale = opts.stale;
    this.data = writable(opts.data);
    if (
      typeof window !== "undefined" &&
      typeof window === "object" &&
      window.mode !== "ssr" &&
      window.initialDataPayload?.route === currentPathStore
    ) {
      this.data.set(window.initialDataPayload.data)
    }
  }
  async fetch() {
    let result = {}
    try {
      const { protocol, hostname, port } = window.location;
      const portDefault = protocol === 'https:' ? '443' : '80';
      const hostnameQualified = `${hostname}${port && port !== portDefault ? ':' + port : ''}`;
      const loc = `${protocol}//${hostnameQualified}${this.storePath}`;
      // Note: CSRF?
      const reqOptions = {
        method: "DXS",
        headers: { "Content-Type": "application/json" }
      }
      const resultRaw = await fetch(loc, reqOptions);
      const resultJson = await resultRaw.json();
      result = resultJson
    } catch (err) {
      console.error('Server Request Failed - Contact Site Administrator.')
    }
    console.info('DXS GET Result: ', result)
    this.data.set(result);
  }
}

routes.map(
  (route) =>
    (serverDataStore[route] = new ServerDataStore({ storePath: route }))
);

async function refreshServerStore(store) {
  if (!serverDataStore[store] ?? serverDataStore[store].stale === false)
    return null;
  await serverDataStore[store].fetch();
}

export const goto = (href) => {
  return () => {
    const thisPath = onlyPath(href)
    // Guard clause to navigate to destinations not within the scope of the SPA router
    if (!routes.some((route) => thisPath === route)) {
      return (window.location.href = href);
    }
    // Push the href into the history stack and update the stored location
    window.history.pushState({}, "", href);
    currentPathStore.set(thisPath);
    refreshServerStore(thisPath);
  };
};

if (
  typeof window !== "undefined" &&
  typeof window === "object" &&
  window.mode !== "ssr"
) {
  if (window?.initialDataPayload) {
    delete window.initialDataPayload
  }
  console.log(routes);
  function hrefHandle(e) {
    if (e.target.tagName.toLowerCase() === "a") {
      e.preventDefault();
      const href = e.target.getAttribute("href");
      if (typeof href !== "string") {
        return console.error("Invalid Href Attribute");
      }
      goto(href)();
    }
  }
  document.addEventListener("click", function (e) {
    if (e.target.tagName.toLowerCase() === "a") {
      hrefHandle(e);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.keyCode === 13 && e.target.tagName.toLowerCase() === "a") {
      e.target.click();
    }
  });
}

export default { routes, goto };
