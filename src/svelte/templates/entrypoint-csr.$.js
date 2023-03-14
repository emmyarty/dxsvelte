// Import compiled CSR Svelte app.
import App from '{{App}}';

// Clean up the pathname argument.
function clPath (str) {
  str = str.replace(/^\/|\/$/g, "");
  str = str.replace(/\/{2,}/g, "/");
  str = `/${str}`;
  return str
}

// Mount the application.
new App({
    target: document.body,
    props: {
      currentRoute: clPath(window.location.pathname)
    }
})