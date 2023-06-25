// This is a file which gets generated per module and in the same directory.
// It ensures that objects being imported are 'localised' as appropriate.

//@ts-ignore
import { activeViewStore, onlyPath } from `@dxsvelte:router`
import { Writable, writable } from "svelte/store";

const viewStore = activeViewStore as Writable<{ route: string, href: string }>

export const ViewState = writable({ pathSatisfies: (str: string): boolean => false })

viewStore.subscribe(value => {
    ViewState.set({ pathSatisfies: (pathToTest: string) => onlyPath(pathToTest) === value.href })
})

type Callback = (data: any[]) => Promise<any>

declare global {
    interface Window {
        'X-CSRFToken': string;
    }
}

interface XCSRFToken {
    'X-CSRFToken'?: string;
}

export function getCsrfTokenHeader (): XCSRFToken {
    if (typeof window !== "undefined" && typeof window['X-CSRFToken'] === "string") {
        return { 'X-CSRFToken': window['X-CSRFToken'] }
    }
    return {}
}

export function FormSetup (endpoint: string, callback: Callback = async (data: any[]) => null) {
    async function post (formData: FormData) {
        const headers = getCsrfTokenHeader()
        const opts: any = {
            headers,
            method: 'POST',
            body: formData
        }
        const resultRaw = await fetch(endpoint, opts)
        const resultJson = await resultRaw.json()
        return callback(resultJson)
    }
    return function (node: HTMLFormElement) {
        const handler = async (event: Event) => {
            event.preventDefault();
            post(new FormData(node));
        }
        node.addEventListener('submit', handler);
    }
}

export default { ViewState, getCsrfTokenHeader, FormSetup }