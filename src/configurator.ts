import inquirer from 'inquirer'
import chalk from 'chalk'
import figlet from 'figlet'
import { execSync } from 'child_process'
import { basename, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { statSync, readFileSync, copyFileSync, writeFileSync, appendFileSync } from 'fs'
import { getPythonCommand, getPipCommand, getMainAppName } from './python'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))

const maindir = process.cwd()

//@ts-expect-error
const isBun = typeof Bun !== "undefined"

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
}

function constructUpdatedPackage(obj: any) {
  const coreInclude = {
    name: getMainAppName(),
    type: 'module'
  }
  const scriptsInclude = {
    build: `${isBun?'bun':'npm'} run build:csr && ${isBun?'bun':'npm'} run build:ssr`,
    'build:csr': 'vite build',
    'build:ssr': 'vite build --ssr',
    conf: 'dxsvelte'
  }
  const devDependenciesInclude = {
    '@types/node': '^18.14.6',
    dxsvelte: '0.2.0-alpha.20',
    esbuild: '0.18.7',
    figlet: '^1.6.0',
    inquirer: '^9.2.7',
    'js-base64': '^3.7.5',
    svelte: '^4.2.2',
    vite: '^4.5.0'
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

function injectFile(filePath: string, inject: string, create: boolean = false): void {
  if (checkFileExists(filePath)) {
    const data = readFileSync(filePath, 'utf8')
    if (!data.includes(inject)) {
      appendFileSync(filePath, `\n${inject}`)
    }
  } else {
    if (create) {
      appendFileSync(filePath, inject)
    } else {
      console.error(`Could not install config to: ${basename(filePath)}.`)
    }
  }
}

async function installPythonScript() {
  try {
    console.log('Installing Python Script in /node_modules ...')
    const envFilePath = getFullPath('.env')
    const settingFilePath = getFullPath(join(getMainAppName()!, 'settings.py'))
    injectFile(envFilePath, `PYTHONPATH="node_modules/dxsvelte/dist"`, true)
    injectFile(settingFilePath, `import sys;sys.path.insert(0, 'node_modules/dxsvelte/dist')`, false)
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
    execSync(`${getPipCommand()} install dxsvelte`, {
      stdio: 'ignore',
      shell: process.env.SHELL
    })
    return true
  } catch (_) {}
  return false
}

async function installNodeDependencies() {
  console.log('Installing Node dependencies...')
  try {
    execSync(`${isBun?'bun':'npm'} i`, {
      stdio: 'ignore',
      shell: process.env.SHELL
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
  'PIP Install Python Dependencies': {
    checked: true,
    disabled: false,
    action: installPythonDependencies
  },
  [`${isBun?'Bun':'NPM'} Install${isBun?' ':' Node '}dependencies`]: {
    checked: true,
    disabled: false,
    action: installNodeDependencies
  },
  'Use DxSvelte Script in /node_modules (Deprecated)': {
    checked: false,
    disabled: false,
    action: installPythonScript
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
      font: 'Slant',
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
    await Promise.all(
      menu.operations.map((operation: string) => {
        if (operationOptions.hasOwnProperty(operation)) {
          return operationOptions[operation].action()
        }
      })
    )
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
