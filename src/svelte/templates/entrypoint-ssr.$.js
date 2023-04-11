// Before evaluating this script, we must set the SSRPATH and SSRJSON variables within the context object

// Import compiled SSR Svelte app.
import App from '{{App}}';
import { decode } from 'js-base64';

const currentView = SSRPATH ?? "/"

let initialDataPayload = {}
let payload = ''
let ssrData = {}

try {
  const base64JsonString = SSRJSON.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64JsonString.length % 4;
  const paddedBase64String = padding ? base64JsonString + '='.repeat(4 - padding) : base64JsonString;
  const ssrDataString = decode(paddedBase64String);

  ssrData = JSON.parse(ssrDataString)
  initialDataPayload[currentView] = ssrData

  payload = `<script>
  function unwrap(payload) {
    const base64JsonString = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64JsonString.length % 4;
    const paddedBase64String = padding ? base64JsonString + '='.repeat(4 - padding) : base64JsonString;
    const jsonString = atob(paddedBase64String, 'base64');
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      console.error(err);
      return {}
    }
  }
  const payload = "${SSRJSON}"
  window.initialDataPayload = { route: "${currentView}", data: unwrap(payload) }
  </script>`
} catch (err) { }

// Mount and render the application
const { head, html, css } = App.render({
  currentView,
  ssrData
});

const htmlPreload = html + payload

// Gather the application parts back into an object and serialise them into JSON
const result = JSON.stringify({ head, html: htmlPreload, css });