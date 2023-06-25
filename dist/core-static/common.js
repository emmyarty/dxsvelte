//@ts-ignore
import { activeViewStore, onlyPath } from `@dxsvelte:router`
import { writable } from "svelte/store";

/** @type {import('svelte/store').Writable<{ route: string, href: string }>} */
const viewStore = activeViewStore

/** @type {import('svelte/store').Writable<{ pathSatisfies: (str: string) => boolean }>} */
export const ViewState = writable({ pathSatisfies: (str) => false })

viewStore.subscribe(value => {
    ViewState.set({ pathSatisfies: (pathToTest) => onlyPath(pathToTest) === value.href })
})

/**
 * @typedef {Object} XCSRFToken
 * @property {string} ['X-CSRFToken']
 */

/**
 * @returns {XCSRFToken}
 */
export function getCsrfTokenHeader() {
    if (typeof window !== "undefined" && typeof window['X-CSRFToken'] === "string") {
        return { 'X-CSRFToken': window['X-CSRFToken'] }
    }
    return {}
}

/**
 * @typedef {(data: any[]) => Promise<any>} Callback
 */

/**
 * @param {string} endpoint
 * @param {Callback} [callback]
 * @returns {(node: HTMLFormElement) => void}
 */
export function FormSetup (endpoint, callback = async (data) => null) {
    async function post(formData) {
        const headers = getCsrfTokenHeader()
        const opts = {
            headers,
            method: 'POST',
            body: formData
        }
        const resultRaw = await fetch(endpoint, opts)
        const resultJson = await resultRaw.json()
        return callback(resultJson)
    }
    return function (node) {
        const handler = async (event) => {
            event.preventDefault();
            post(new FormData(node));
        }
        node.addEventListener('submit', handler);
    }
}

export default { ViewState, getCsrfTokenHeader, FormSetup }