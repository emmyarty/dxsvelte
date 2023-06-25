// Import compiled CSR Svelte app.
import App from '@dxsvelte:app';

// Clean up the pathname argument.
function clPath (str) {
  str = str.replace(/^\/|\/$/g, "");
  str = str.replace(/\/{2,}/g, "/");
  str = `/${str}`;
  return str
}

// Create a new DOM node
const container = document.createElement('body');

// Mount the application.
new App({
    target: container,
    props: {
      currentView: clPath(window.location.pathname)
    }
})

// Replace the current document.body with the new DOM node hosting the app
document.body.replaceWith(container);