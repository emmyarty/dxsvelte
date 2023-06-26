import type { PreResolvedOptions } from '@sveltejs/vite-plugin-svelte/src/types/options.d.ts'

interface ConfigOptions {
  python?: string
  django?: string
  mainApp?: string
  baseDirectory?: string
  views?: string
}

type DxSvelteConfig = PreResolvedOptions & ConfigOptions

export function dxsvelte(proposed: DxSvelteConfig | null): Plugin
