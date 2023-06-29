import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmdirSync, unlinkSync, statSync, copyFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import esbuild from 'esbuild'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))

function deleteDirectorySync(targetDir: string): void {
  if (existsSync(targetDir)) {
    readdirSync(targetDir).forEach((file) => {
      const curPath = join(targetDir, file)
      statSync(curPath).isDirectory() ? deleteDirectorySync(curPath) : unlinkSync(curPath)
    })
    rmdirSync(targetDir)
  }
}

function recursiveCopyDirectorySync(srcDir: string, destDir: string): void {
  if (existsSync(srcDir)) {
    !existsSync(destDir) && mkdirSync(destDir, { recursive: true })
    readdirSync(srcDir).forEach((entry) => {
      const srcPath = join(srcDir, entry)
      const destPath = join(destDir, entry)
      statSync(srcPath).isDirectory() ? recursiveCopyDirectorySync(srcPath, destPath) : writeFileSync(destPath, readFileSync(srcPath))
    })
  }
}

function makeDirectory(dest: string) {
  try {
    mkdirSync(dest, { recursive: true })
  } catch (_) {}
}

deleteDirectorySync('./dist')
makeDirectory('./dist')

const banner = { js: '#!/usr/bin/env node\n' }

const external = ['require', 'fs', 'path', 'url', 'child_process', 'esbuild', 'svelte', '@sveltejs/vite-plugin-svelte', 'figlet', 'inquirer']

await esbuild
  .build({
    // entryPoints: [join(moduleDirectory, 'main.ts')],
    entryPoints: [join(moduleDirectory, 'dxsvelte.ts')],
    mainFields: ['module', 'node'],
    platform: 'node',
    bundle: true,
    minify: false,
    sourcemap: true,
    outfile: './dist/dxsvelte.js',
    format: 'esm',
    plugins: [],
    external
    // banner
  })
  .catch(() => {
    console.error('Build failed for dxsvelte plugin; exiting.')
    process.exit(1)
  })

await esbuild
  .build({
    // entryPoints: [join(moduleDirectory, 'main.ts')],
    entryPoints: [join(moduleDirectory, 'configurator.ts')],
    mainFields: ['module', 'node'],
    platform: 'node',
    bundle: true,
    minify: false,
    sourcemap: true,
    outfile: './dist/configurator.js',
    format: 'esm',
    plugins: [],
    external,
    banner
  })
  .catch(() => {
    console.error('Build failed for dxsvelte plugin; exiting.')
    process.exit(1)
  })

copyFileSync('./src/dxsvelte.py', './dist/dxsvelte.py')
copyFileSync('./src/dxsvelte.d.ts', './dist/dxsvelte.d.ts')
copyFileSync('./src/vite.config.js', './dist/vite.config.js')
recursiveCopyDirectorySync('./src/client-types', './dist/client-types')
recursiveCopyDirectorySync('./src/core-static', './dist/core-static')

function importJson(fpath: string): string[] {
  try {
    const dataStr = readFileSync(fpath, 'utf8')
    const data = JSON.parse(dataStr)
    if (typeof data === 'undefined' || !Array.isArray(data) || data.some((item) => typeof item !== 'string')) {
      return []
    }
    return data
  } catch (_) {
    return []
  }
}

// Optional targets to copy the newly compiled dist to.
// Not for general use, requires a local-updates.json containing an array of target paths.
// Be careful if you choose to use it - the specified directory will be deleted and replaced.
const additionalTargets = importJson('local-updates.json')
additionalTargets.forEach((target) => {
  console.log(`Carrying across to: ${target}`)
  deleteDirectorySync(target)
  recursiveCopyDirectorySync('.', target)
})

console.log('Build succeeded; exiting.')
