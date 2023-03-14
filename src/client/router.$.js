import { writable } from 'svelte/store';

function onlyPath(path) {
  let queryIndex = path.indexOf('?');
  if (queryIndex !== -1) {
    path = path.slice(0, queryIndex);
  }
  path = path.replace(/^\/|\/$/g, "");
  path = path.replace(/\/{2,}/g, "/");
  path = "/" + path;
  return path;
}

export const currentPathStore = writable("/");

// Define your routes as an object with the path as the key and the component as the value
export const routes = JSON.parse(`{{router}}`)
// export const routes = routesImported.map(route => route = onlyPath(route));

export const goto = (href) => {
  return () => {
    // Guard clause to navigate to destinations not within the scope of the SPA router
    if (!routes.some(route => onlyPath(href) === route)) {
      return window.location.href = href
    }
    // Push the href into the history stack and update the stored location
    window.history.pushState({}, "", href)
    currentPathStore.set(onlyPath(href))
  }
}

if (typeof window !== 'undefined') {
  function hrefHandle(e) {
    if (e.target.tagName.toLowerCase() === "a") {
      e.preventDefault()
      const href = e.target.getAttribute("href")
      if (typeof href !== "string") {
        return console.error('Invalid Href Attribute')
      }
      goto(href)()
    }
  }
  document.addEventListener("click", function (e) {
    if (e.target.tagName.toLowerCase() === "a") {
      hrefHandle(e)
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.keyCode === 13 && e.target.tagName.toLowerCase() === "a") {
      e.target.click()
    }
  });
}

export default { routes, goto }