// Before evaluating this script, we must set the SSRPATH, SSRJSON, and CSRFTOKEN variables within the context object

// Import compiled SSR Svelte app.
import App from '@dxsvelte:app';
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
  function decode(payload) {
    const base64JsonString = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64JsonString.length % 4;
    const paddedBase64String = padding ? base64JsonString + '='.repeat(4 - padding) : base64JsonString;
    const jsonString = atob(paddedBase64String, 'base64');
    return jsonString
  }
  function unwrap(payload) {
    const jsonString = decode(payload)
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      console.error(err);
      return {}
    }
  }
  const payload = "${SSRJSON}"
  window.initialDataPayload = { route: "${currentView}", data: unwrap(payload) }
  window["X-CSRFToken"] = decode("${SSRCSRF}")
  </script>`
} catch (err) { }

// Mount and render the application
const { head, html, css } = App.render({
  currentView,
  ssrData
});

const htmlPreload = html + payload

// Gather the application parts back into an object and serialise them into JSON
// This script is a partial. It refers to variables which are not declared, and
// declares one below that isn't exported. This is intentional, as the embedded
// V8 binary prepends and appends those lines at runtime.
const result = JSON.stringify({ head, html: htmlPreload, css });