import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmdirSync, unlinkSync, statSync, copyFileSync, renameSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import esbuild from 'esbuild'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))

function versionNpmToPy(input: string) {
  input = input.replace('-alpha.', 'a')
  input = input.replace('-beta.', 'b')
  input = input.replace('-rc.', 'rc')
  return input
}

function updateTomlString(input: string, packagejson: any) {
  let lines = input.split('\n')
  lines = lines.map((line) => {
    switch (line.split('= ')[0].trim()) {
      case 'name':
        return `name = "${packagejson.name}"`
      case 'version':
        return `version = "${versionNpmToPy(packagejson.version)}"`
      case 'description':
        return `description = "${packagejson.description}"`
      case 'authors':
        return `authors = [{ name = "${packagejson.author}" }]`
      default:
        return line
    }
  })
  return lines.join('\n')
}

const packagejson: any = JSON.parse(readFileSync(join(moduleDirectory, '..', 'package.json'), 'utf8'))
const tomlPath = join(moduleDirectory, '..', 'pyproject.toml')
const tomlString = readFileSync(tomlPath, 'utf8')
const tomlStringUpdated = updateTomlString(tomlString, packagejson)
if (typeof tomlStringUpdated === 'undefined') throw new Error('Failed to update pyproject.toml')
writeFileSync(tomlPath, tomlStringUpdated)

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

function spawnPromise(command: string) {
  const commandArgs = command.split(' ')
  const commandName = commandArgs.shift()
  if (typeof commandName !== 'string') throw new Error('Invalid command')
  return new Promise((resolve, reject) => {
    const child = spawn(commandName, commandArgs, { stdio: 'inherit' })
    child.stdout?.pipe(process.stdout)
    child.stderr?.pipe(process.stderr)
    child.on('close', (code) => resolve(code))
    child.on('error', (err) => reject(err))
  })
}

async function makePythonBuild() {
  await spawnPromise('python3 -m hatch build')
}

deleteDirectorySync('./pypi')
makeDirectory('./pypi')

deleteDirectorySync('./dist')
makeDirectory('./dist')

makePythonBuild()

const banner = { js: '#!/usr/bin/env node\n' }

const external = ['require', 'fs', 'path', 'url', 'child_process', 'esbuild', 'svelte', '@sveltejs/vite-plugin-svelte', 'figlet', 'inquirer']

await esbuild
  .build({
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

// Mandatory targets to copy the newly compiled dist to.
copyFileSync('./src/dxsvelte/dxsvelte.py', './dist/dxsvelte.py')
copyFileSync('./src/dxsvelte.d.ts', './dist/dxsvelte.d.ts')
copyFileSync('./src/vite.config.js', './dist/vite.config.js')
recursiveCopyDirectorySync('./src/client-types', './dist/client-types')
recursiveCopyDirectorySync('./src/core-static', './dist/core-static')

// Optional targets to copy the newly compiled dist to.
// Not for general use, requires a local-updates.json containing an array of target paths.
// Be careful if you choose to use it - the specified directory will be deleted and replaced.
function importJson(fpath: string): string[] {
  try {
    const data = JSON.parse(readFileSync(fpath, 'utf8'))
    return (typeof data === 'undefined' || !Array.isArray(data) || data.some((item) => typeof item !== 'string')) ? [] : data
  } catch (_) {
    return []
  }
}

const additionalTargets = importJson('local-updates.json')
additionalTargets.forEach((target) => {
  console.log(`Carrying across to: ${target}`)
  deleteDirectorySync(target)
  recursiveCopyDirectorySync('.', target)
})

console.log('Build succeeded; exiting.')
