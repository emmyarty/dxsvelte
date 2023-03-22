import { writable } from 'svelte/store';
import { serverDataStore, currentPathStore } from "{{fnameRouter}}";

export const data = writable({})

currentPathStore.subscribe(currentPath => {
    data.set(serverDataStore[currentPath].data)
  });