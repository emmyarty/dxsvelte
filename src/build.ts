import esbuild from 'esbuild'
import path from 'path'
import { mkdirSync, copyFileSync } from 'fs'
import * as url from 'url'
import { injectorPlugin } from './compiler/injector'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

function makeDirectory(dest: string) {
  try {
    mkdirSync(dest, { recursive: true })
  } catch (err) {
    console.info(`${dest} folder already exists; continuing.`)
  }
}

makeDirectory('./dist')
makeDirectory('./dist/client-types')

const banner = { js: '#!/usr/bin/env node\n' }

const external = [
  'require',
  'fs',
  'path',
  'esbuild',
  'url',
  'child_process',
  'svelte',
  'esbuild-plugin-postcss',
  'esbuild-svelte',
  'svelte-preprocess',
  'esbuild-plugin-postcss',
  'esbuild-plugin-inline-import'
]

await esbuild
  .build({
    entryPoints: [path.join(__dirname, 'entrypoint-init.ts')],
    mainFields: ['module', 'node'],
    platform: 'node',
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: './dist/dxsvelte-init.js',
    format: 'esm',
    plugins: [injectorPlugin()],
    external,
    banner
  })
  .catch(() => {
    console.error('Build failed for dxsvelte-init.js; exiting.')
    process.exit(1)
  })

await esbuild
  .build({
    entryPoints: [path.join(__dirname, 'entrypoint-compiler.ts')],
    mainFields: ['module', 'node'],
    platform: 'node',
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: './dist/dxsvelte-compiler.js',
    format: 'esm',
    plugins: [injectorPlugin()],
    external,
    banner
  })
  .catch(() => {
    console.error('Build failed for dxsvelte-compiler.js; exiting.')
    process.exit(1)
  })

copyFileSync('./src/client-types/@common.ts', './dist/client-types/@common.ts')
copyFileSync('./src/client-types/@page.ts', './dist/client-types/@page.ts')

console.log('Build succeeded; exiting.')
