// Generic exports - will be cleaned up and replaced with proper type definitions
import { writable } from 'svelte/store';

/**
 * Returns an object containing the server-side props for the current view, created from the dict returned by the server.
 * As this is defined in Python, it will be typed as ``any``; ensure you have client-side runtime validation in place.
 */
export const ServerSideProps = writable({} as any)