import inquirer from 'inquirer'
import chalk from 'chalk'
import figlet from 'figlet'
import { execSync } from 'child_process'
import { basename, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { statSync, readFileSync, copyFileSync, writeFileSync } from 'fs'
import { getPythonCommand, getPipCommand, getMainAppName } from './python'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))

const maindir = process.cwd()

let debug: boolean = false

try {
  const args = process.argv.slice(2)
  if (typeof args !== 'undefined' && Array.isArray(args) && args.includes('--debug')) {
    debug = true
  }
} catch (_) {}

function getFullPath(file: string) {
  const pathSegments = debug ? [maindir, 'debug', file] : [maindir, file]
  return join(...pathSegments)
}

function checkFileExists(filePath: string) {
  try {
    const result = statSync(filePath)
    if (result) return true
    return false
  } catch (_) {
    return false
  }
}

function isObj(obj: any) {
  if (typeof obj !== 'object') return false
  if (Array.isArray(obj)) return false
  if (obj === null) return false
  return true
}

async function getExistingJson(fpath: string) {
  try {
    const file = readFileSync(fpath, 'utf8')
    const json = JSON.parse(file)
    if (!isObj(json)) {
      const fname = basename(fpath)
      throw new Error(`File ${fname} is not valid. Skipping config.`)
    }
    return json
  } catch (err) {
    const fileExists = checkFileExists(fpath)
    if (fileExists) {
      const fname = basename(fpath)
      console.error(`File ${fname} is not valid. Skipping config.`)
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
    '@page': ['node_modules/dxsvelte/dist/client-types/@page.ts'],
    '@common': ['node_modules/dxsvelte/dist/client-types/@common.ts']
  }
  // Delete superseded subkeys; for future use
  const compilerOptionsPathsOmit: any[] = []
  // Initialise a blank object for obj.compilerOptions if necessary
  if (!isObj(obj.compilerOptions)) obj.compilerOptions = {}
  obj.compilerOptions = { ...obj.compilerOptions, ...compilerOptionsCore }
  // Configure and update obj.compilerOptions.lib
  if (typeof obj.compilerOptions.lib === 'string') obj.compilerOptions.lib = [obj.compilerOptions.lib]
  if (typeof obj.compilerOptions.lib === 'undefined' || !Array.isArray(obj.compilerOptions.lib)) obj.compilerOptions.lib = []
  if (!obj.compilerOptions.lib.includes('ES2022')) obj.compilerOptions.lib.push('ES2022')
  if (!obj.compilerOptions.lib.includes('dom')) obj.compilerOptions.lib.push('dom')
  // Configure and update obj.compilerOptions.paths
  if (typeof obj.compilerOptions.paths === 'undefined') obj.compilerOptions.paths = {}
  obj.compilerOptions.paths = {
    ...obj.compilerOptions.paths,
    ...compilerOptionsPathsInclude
  }
  compilerOptionsPathsOmit.map((key) => (obj.compilerOptions.paths[key] ? delete obj.compilerOptions.paths[key] : null))
  // Configure and update obj.types
  if (typeof obj.types === 'undefined') obj.types = []
  if (typeof obj.types === 'string') obj.types = [obj.types]
  if (!obj.types.includes('node')) obj.types.push('node')
  return obj
}

async function configureTSConfig() {
  try {
    console.log('Configuring TSConfig...')
    const fpath = getFullPath('tsconfig.json')
    const fileContentOriginal = await getExistingJson(fpath)
    const fileContentUpdated = constructUpdatedTsconfig(fileContentOriginal)
    writeFileSync(fpath, JSON.stringify(fileContentUpdated, null, 4))
    return true
  } catch (_) {
    console.error(_)
    return false
  }
  return null
}

function constructUpdatedPackage(obj: any) {
  const coreInclude = {
    name: getMainAppName(),
    type: 'module'
  }
  const scriptsInclude = {
    dev: 'vite',
    build: 'vite build'
  }
  const devDependenciesInclude = {
    '@types/node': '^18.14.6',
    dxsvelte: '~0.2.0',
    esbuild: '0.18.7',
    figlet: '^1.6.0',
    inquirer: '^9.2.7',
    'js-base64': '^3.7.5',
    svelte: '^4.0.0',
    vite: '^4.3.9'
  }
  const dependenciesInclude = {}
  obj = { ...obj, ...coreInclude }
  if (!isObj(obj.scripts)) obj.scripts = {}
  obj.scripts = { ...obj.scripts, ...scriptsInclude }
  if (!isObj(obj.devDependencies)) obj.devDependencies = {}
  obj.devDependencies = { ...obj.devDependencies, ...devDependenciesInclude }
  if (!isObj(obj.dependencies)) obj.dependencies = {}
  obj.dependencies = { ...obj.dependencies, ...dependenciesInclude }
  return obj
}

async function configurePackage() {
  try {
    console.log('Configuring Package...')
    const fpath = getFullPath('package.json')
    const fileContentOriginal = await getExistingJson(fpath)
    const fileContentUpdated = constructUpdatedPackage(fileContentOriginal)
    writeFileSync(fpath, JSON.stringify(fileContentUpdated, null, 4))
    return true
  } catch (_) {
    return false
  }
}

async function installPythonScript() {
  try {
    console.log('Installing Python Script...')
    const fpath = getFullPath('dxsvelte.py')
    copyFileSync(join(moduleDirectory, 'dxsvelte.py'), fpath)
    return true
  } catch (_) {
    return false
  }
}

async function configureVite() {
  try {
    console.log('Configuring Vite...')
    const fpath = getFullPath('vite.config.js')
    copyFileSync(join(moduleDirectory, 'vite.config.js'), fpath)
    return true
  } catch (_) {
    return false
  }
}

async function installPythonDependencies() {
  console.log('Installing Python dependencies...')
  try {
    execSync(`${getPipCommand()} install py-mini-racer`, {
      stdio: 'ignore'
    })
    return true
  } catch (_) {}
  return false
}

async function installNodeDependencies() {
  console.log('Installing Node dependencies...')
  try {
    execSync(`npm i`, {
      stdio: 'ignore'
    })
    return true
  } catch (_) {}
  return false
}

const operationOptions = {
  'Configure TSConfig': {
    checked: true,
    disabled: false,
    action: configureTSConfig
  },
  'Configure Package': {
    checked: true,
    disabled: false,
    action: configurePackage
  },
  'Configure Vite': {
    checked: !checkFileExists(getFullPath('vite.config.js')),
    disabled: false,
    action: configureVite
  },
  'Install Python Script': {
    checked: true,
    disabled: false,
    action: installPythonScript
  },
  'PIP Install Python V8 Dependency': {
    checked: false,
    disabled: false,
    action: installPythonDependencies
  },
  'NPM Install Node dependencies': {
    checked: false,
    disabled: false,
    action: installNodeDependencies
  }
}

const operationOptionsArr = Object.keys(operationOptions).map((name) => ({
  name,
  checked: operationOptions[name].checked,
  disabled: operationOptions[name].disabled
}))

async function main() {
  console.log(
    figlet.textSync('DxSvelte', {
      font: 'slant',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: true
    })
  )
  const whitespaceLines = Math.max(0, (process.stdout.rows || 0) - 9 - 7)
  console.log('\n'.repeat(whitespaceLines))
  const menu = await inquirer.prompt([
    {
      type: 'checkbox',
      message: 'Select operations. CTRL+C to cancel.\n',
      name: 'operations',
      choices: [new inquirer.Separator(), ...operationOptionsArr]
    }
  ])

  const confirmation = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure?'
    }
  ])

  if (!confirmation.confirm) {
    main()
  } else {
    await Promise.all(menu.operations.map((operation) => operationOptions[operation].action()))
  }
}

function checkIsDjangoProject() {
  try {
    const result = statSync(join(maindir, 'manage.py'))
    if (result) return true
    return false
  } catch (_) {
    return false
  }
}

if (debug || checkIsDjangoProject()) {
  main()
} else {
  const message = 'DxSvelte Configurator must be run from the working directory of a Django project.'
  const formattedMessage = chalk.red(message)
  console.error(formattedMessage)
}
