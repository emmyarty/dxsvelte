// Generic exports - will be cleaned up and replaced with proper type definitions
import { writable } from 'svelte/store';

/**
 * Returns a CSRF token header object you can use to make your requests to the back-end.
 * 
 * @returns {{'X-CSRFToken'?: string}} An object containing a CSRF token header.
 */
export const getCsrfTokenHeader = ():{'X-CSRFToken'?: string} => { return { 'X-CSRFToken': 'TOKEN_VALUE' } }

/**
 * Writable Svelte store containing a method to check if a given path satisfies the currently active path.
 * 
 * Usage example (in a Svelte component):
 * ```js
 * import { ViewState } from "@common"
 * const href = `/this/link/target/path`
 * $: active = $ViewState.pathSatisfies(href);
 * ```
 * 'active' will be true if the current path is '/this/link/target/path', which we can use to apply a class to the link.
 */
export const ViewState = writable({ pathSatisfies: (pathString: string): boolean => false })

/**
 * Setup function for form elements which injects the CSRF token and accepts an optional callback.
 * To be used to POST to the Django back-end.
 * 
 * @param {string} endpoint - The API endpoint.
 * @param {(data: any[]) => Promise<any>} [callback=async (data: any[]) => null] - Optional callback function to handle the server response.
 * @returns {(node: HTMLFormElement) => void} A function that takes a form element and sets it up.
 * ```jsx
 * <script>
 *   import { FormSetup } from '@common';
 *   const loginForm = FormSetup('/login/');
 * </script>
 * 
 * <form use:loginForm>
 *     <input type="text" name="username" autocomplete="username"/>
 *     <input type="password" name="password" autocomplete="current-password"/>
 *     <button type="submit">Login</button>
 * </form>
 * ```
 */
export function FormSetup (endpoint: string, callback: (data: any[]) => Promise<any> = async (data: any[]) => null): (node: HTMLFormElement) => void { return function (node: HTMLFormElement) {} }

/**
 * Navigates to the specified URL. It can be a relative or absolute URL; if it sits outside the scope of the
 * client-side router, it will be handled by the browser instead of being intercepted.
 * 
 * @param {string} url - The URL to navigate to.
 * @returns {Promise<void>} Resolves to ``undefined`` when navigation is complete.
 */
export async function goto(url: string): Promise<void> { url; return undefined }