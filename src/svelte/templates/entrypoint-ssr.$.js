// Import compiled SSR Svelte app.
import App from '{{App}}';

// Import the data store
// import { data } from "{{fnameData}}";

// Janky temporary workaround to avoid unneeded stdio outputs
const SSRPATH = process.argv[2];
const SSRJSON = process.argv[3];
const __console = console;

const currentRoute = SSRPATH ?? "/"

let initialDataPayload = {}
let initialDataPayloadScript = ''

try {
  const jsonString = decodeURIComponent(SSRJSON)
  const jsonObject = JSON.parse(jsonString)
  initialDataPayload[currentRoute] = jsonObject
  initialDataPayloadScript = `<script>
  window.onload = function () {
    window.initialDataPayload = { route: \`${currentRoute}\`, data: JSON.parse(\`${jsonString}\`) };
  };
  </script>`
} catch (err) {
  
}

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
  currentRoute
});

const htmlPreload = html + initialDataPayloadScript

// Gather the application parts back into an object and serialise them into JSON
const outputJSON = JSON.stringify({ head, html: htmlPreload, css });

// Pipe the output into the console using the hijacked console
__console.log(outputJSON);