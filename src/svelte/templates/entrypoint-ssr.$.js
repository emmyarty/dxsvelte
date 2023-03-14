// Import compiled SSR Svelte app.
import App from '{{App}}';

// Janky temporary workaround to avoid unneeded stdio outputs
const SSRPATH = process.argv[2];
const __console = console;
console = new Proxy(
  {},
  {
    get(target, prop) {
      return function () {};
    },
  }
);

// Mount and render the application
const { head, html, css } = App.render({
  currentRoute: SSRPATH ?? "/",
});

// Gather the application parts back into an object and serialise them into JSON
const outputJSON = JSON.stringify({ head, html, css });

// Pipe the output into the console using the hijacked console
__console.log(outputJSON);