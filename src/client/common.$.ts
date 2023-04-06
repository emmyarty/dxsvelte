// This is a file which gets generated per module and in the same directory.
// It ensures that objects being imported are 'localised' as appropriate.

//@ts-ignore
import { activeViewStore, onlyPath } from `{{fnameRouter}}`
import { Writable, writable } from "svelte/store";

const viewStore = activeViewStore as Writable<{ route: string, href: string }>

export const ViewState = writable({ pathSatisfies: (str: string): boolean => false })

viewStore.subscribe(value => {
    ViewState.set({ pathSatisfies: (pathToTest: string) => onlyPath(pathToTest) === value.href })
})

export default { ViewState }