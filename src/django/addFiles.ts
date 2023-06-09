// @ts-ignore
import dxsvelteTemplate from './dxsvelte.$.py'
import { accessSync, readFileSync, writeFileSync } from 'fs'
import { __basedir, __main } from '../settings/config'
import { basename, join } from 'path'

function getPath(file: string) {
  return join(__basedir, file)
}

function exists(fpath: string) {
  try {
    accessSync(fpath)
    return true
  } catch (err) {
    return false
  }
}

let _mainDir: string | null = null
function mainDir() {
  if (_mainDir !== null) return _mainDir
  const managePyContent = readFileSync('./manage.py', 'utf8').toString()
  const match = managePyContent.match(
    /os\.environ\.setdefault\(\s*("DJANGO_SETTINGS_MODULE"|'DJANGO_SETTINGS_MODULE')\s*,\s*("(.+)\.settings"|'(.+)\.settings')\)/
  )
  if (match) {
    let djangoSettingsModule = match[2]
    djangoSettingsModule = djangoSettingsModule.replace(/^"(.*)"$/, '$1')
    djangoSettingsModule = djangoSettingsModule.replace(/^'(.*)'$/, '$1')
    _mainDir = djangoSettingsModule.split('.')[0]
    return _mainDir
  } else {
    throw new Error('DJANGO_SETTINGS_MODULE not found in manage.py.')
  }
}

const isObj = (obj: any) => {
  if (typeof obj !== 'object') return false
  if (Array.isArray(obj)) return false
  if (obj === null) return false
  return true
}

async function getExistingJson(fpath: string) {
  try {
    const file = readFileSync(fpath, 'utf8').toString()
    const json = JSON.parse(file)
    if (!isObj(json)) {
      const fname = basename(fpath)
      throw new Error(`File ${fname} is an Array. Skipping update.`)
    }
    return json
  } catch (err) {
    const fileExists = exists(fpath)
    if (fileExists) {
      const fname = basename(fpath)
      console.error(`File ${fname} is not valid. Skipping update.`)
      throw err
    }
    return {}
  }
}

function constructUpdatedTsconfig(obj: any) {
  // These keys will be added / overwritten
  const compilerOptionsCore = {
    target: 'ES2022',
    allowJs: true,
    skipLibCheck: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    strict: true,
    forceConsistentCasingInFileNames: true,
    noFallthroughCasesInSwitch: true,
    module: 'ES2022',
    moduleResolution: 'node',
    noEmit: true,
    baseUrl: '.'
  }
  // These subkeys will be added / overwritten
  const compilerOptionsPathsInclude = {
    '@main/*': [mainDir() + '/*'],
    "@page": ["node_modules/dxsvelte/dist/client-types/@page.ts"],
    "@common": ["node_modules/dxsvelte/dist/client-types/@common.ts"]
  }
  // Delete superseded subkeys; for future use
  const compilerOptionsPathsOmit: any[] = []
  // --- End of setup ---
  // Initialise a blank object for obj.compilerOptions if necessary
  if (!isObj(obj.compilerOptions)) obj.compilerOptions = {}
  obj.compilerOptions = { ...obj.compilerOptions, ...compilerOptionsCore }
  // Configure and update obj.compilerOptions.lib
  if (typeof obj.compilerOptions.lib === 'string')
    obj.compilerOptions.lib = [obj.compilerOptions.lib]
  if (
    typeof obj.compilerOptions.lib === 'undefined' ||
    !Array.isArray(obj.compilerOptions.lib)
  )
    obj.compilerOptions.lib = []
  if (!obj.compilerOptions.lib.includes('ES2022'))
    obj.compilerOptions.lib.push('ES2022')
  if (!obj.compilerOptions.lib.includes('dom'))
    obj.compilerOptions.lib.push('dom')
  // Configure and update obj.compilerOptions.paths
  if (typeof obj.compilerOptions.paths === 'undefined')
    obj.compilerOptions.paths = {}
  obj.compilerOptions.paths = {
    ...obj.compilerOptions.paths,
    ...compilerOptionsPathsInclude
  }
  compilerOptionsPathsOmit.map((key) =>
    obj.compilerOptions.paths[key]
      ? delete obj.compilerOptions.paths[key]
      : null
  )
  // Configure and update obj.types
  if (typeof obj.types === 'undefined') obj.types = []
  if (typeof obj.types === 'string') obj.types = [obj.types]
  if (!obj.types.includes('node')) obj.types.push('node')
  return obj
}

function constructUpdatedPackage(obj: any) {
  const coreInclude = {
    name: mainDir(),
    type: 'module'
  }
  const scriptsInclude = {
    refresh: 'node ./node_modules/dxsvelte/dist/dxsvelte-init.js',
    compile: 'node ./node_modules/dxsvelte/dist/dxsvelte-compiler.js'
  }
  const devDependenciesInclude = {
    dxsvelte: '0.1.x',
    '@types/node': '^18.14.6',
    autoprefixer: '^10.4.14',
    esbuild: '0.17.11',
    'esbuild-plugin-inline-import': '^1.0.1',
    'esbuild-plugin-postcss': '^0.1.4',
    'esbuild-svelte': '^0.7.3',
    'js-base64': '^3.7.5',
    postcss: '^8.4.21',
    svelte: '^3.58.0',
    'svelte-preprocess': '^5.0.3'
  }
  // --- End of setup ---
  obj = { ...obj, ...coreInclude }
  if (!isObj(obj.scripts)) obj.scripts = {}
  obj.scripts = { ...obj.scripts, ...scriptsInclude }
  if (!isObj(obj.devDependencies)) obj.devDependencies = {}
  obj.devDependencies = { ...obj.devDependencies, ...devDependenciesInclude }
  return obj
}

const update = {
  dxsvelte: async () => {
    const printErr = () =>
      console.error(
        `Could not install dxsvelte.py. If the file already exists from a previous init, ignore this error.`
      )
    const fpath = getPath('dxsvelte.py')
    try {
      writeFileSync(fpath, dxsvelteTemplate)
    } catch (err) {
      printErr()
      return false
    }
    return true
  },
  package: async () => {
    const fpath = getPath('package.json')
    const file = await getExistingJson(fpath)
    const result = constructUpdatedPackage(file)
    writeFileSync('./package.json', JSON.stringify(result, null, 4))
    return true
  },
  tsconfig: async () => {
    const fpath = getPath('tsconfig.json')
    const file = await getExistingJson(fpath)
    const result = constructUpdatedTsconfig(file)
    writeFileSync('./tsconfig.json', JSON.stringify(result, null, 4))
    return true
  }
}

export async function updateAll() {
  try {
    const result = await Promise.all([
      update.package(),
      update.tsconfig(),
      update.dxsvelte()
    ])
    if (result.includes(false)) {
      throw new Error('Some or all files could not be updated.')
    }
    return true
  } catch (err) {
    console.error('Update Failed.', err)
    return false
  }
}