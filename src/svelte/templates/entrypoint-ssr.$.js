// Import compiled SSR Svelte app.
import App from '{{App}}';

// Janky temporary workaround to avoid unneeded stdio outputs
const SSRPATH = process.argv[2];
const SSRJSON = process.argv[3];

const __console = console;

const currentView = SSRPATH ?? "/"

let initialDataPayload = {}
let initialDataPayloadScript = ''
let jsonString = ''
let jsonObject = {}

try {
  const base64JsonString = SSRJSON.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64JsonString.length % 4;
  const paddedBase64String = padding ? base64JsonString + 'A'.repeat(4 - padding) : base64JsonString;
  const buffer = Buffer.from(paddedBase64String, 'base64');
  jsonString = buffer.toString('utf-8');

  jsonObject = JSON.parse(jsonString)
  initialDataPayload[currentView] = jsonObject

  initialDataPayloadScript = `<script>
  function unwrap(payload) {
    const base64JsonString = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64JsonString.length % 4;
    const paddedBase64String = padding ? base64JsonString + '='.repeat(4 - padding) : base64JsonString;
    const jsonString = atob(paddedBase64String, 'base64');
    try {
      console.log(jsonString)
      return JSON.parse(jsonString);
    } catch (err) {
      console.error(err);
      return {}
    }
  }
  const payload = \`${SSRJSON}\`
  window.initialDataPayload = { route: \`${currentView}\`, data: unwrap(payload) }
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
  currentView,
  ssrData: jsonObject
});

const htmlPreload = html + initialDataPayloadScript

// Gather the application parts back into an object and serialise them into JSON
const outputJSON = JSON.stringify({ head, html: htmlPreload, css });

// Pipe the output into the console using the hijacked console
__console.log(outputJSON);