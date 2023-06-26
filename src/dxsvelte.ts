import { Plugin } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { build as esbuild } from 'esbuild'
import { getDjangoRouter } from './django'
import { getPythonCommand } from './python'
import { randomUUID } from 'crypto'
import { promises, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { exec as execCallback, execSync } from 'child_process'
import { promisify } from 'util'

import { Stats, unlinkSync, promises as fsPromises } from 'fs'
import { join } from 'path'
import * as path from 'path'

const { stat } = promises

import type { Config, ConfigOptions, Route, ViewComponentConfig } from './types'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))

interface IVirtualFileModificationIndex {
  [key: string]: string
}

interface ResolveIdOptions {
  assertions: Record<string, string>;
  custom?: any | undefined;
  ssr?: boolean | undefined;
  isEntry: boolean;
}

const virtualFileModificationIndex: IVirtualFileModificationIndex = {}

async function getFileTimestamps(filePath: string): Promise<{ created: Date; modified: Date }> {
  try {
    const { birthtime: created, mtime: modified }: Stats = await fsPromises.stat(filePath)
    return { created, modified }
  } catch (error) {
    console.error(`Error indexing modification metadata for file: ${filePath}.`)
    throw new Error(`Indexing modification failure: ${error}.`)
  }
}

const baseDirectory = resolve(process.cwd())

let mainAppName: string | null = null

function initMainAppName() {
  const rxFunctionString = /os\.environ\.setdefault\(\s*("DJANGO_SETTINGS_MODULE"|'DJANGO_SETTINGS_MODULE')\s*,\s*("(.+)\.settings"|'(.+)\.settings')\)/
  const settingsStr = readFileSync(join(baseDirectory, 'manage.py'), 'utf8')
  const settingsStrExtract = settingsStr.match(rxFunctionString) ?? []
  const settingsModuleExtract = settingsStrExtract?.length > 3 ? settingsStrExtract[2].replaceAll('"', '').replaceAll("'", '') : ''
  if (settingsModuleExtract === '') {
    throw new Error('Could not extract settings from manage.py. Exiting.')
  }
  const mainModuleExtract = settingsModuleExtract.split('.')
  const mainModuleStr = mainModuleExtract[0]
  mainAppName = mainModuleStr
}
function getMainAppName() {
  if (!mainAppName) {
    initMainAppName()
  }
  return mainAppName
}

function evaluateConfig(proposed: ConfigOptions | null) {
  const config: ConfigOptions = {}
  if (proposed === null) {
    proposed = {}
  }
  config.python = proposed.python ?? getPythonCommand() ?? 'python3'
  config.django = proposed.django ?? `${config.python} ./manage.py runserver 0.0.0.0:8000`
  config.baseDirectory = proposed.baseDirectory ?? resolve(process.cwd())
  config.mainApp = proposed.mainApp ?? getMainAppName()!
  config.views = proposed.views ?? 'views'
  return config as Config
}

function reduceConfig(proposed: ConfigOptions | null) {
  if (!proposed) {
    return undefined
  }

  const dxsvelteConfigKeys = ['python', 'django', 'baseDirectory', 'mainApp', 'views']

  dxsvelteConfigKeys.forEach((key) => {
    if (key in proposed) {
      // @ts-expect-error
      delete proposed[key]
    }
  })

  return proposed
}

function splitStringAfterQuestionMark(str: string) {
  const index = str.indexOf('?')
  return index >= 0 ? str.slice(index + 1) : ''
}

function onDisk(path: string) {
  try {
    return existsSync(path)
  } catch (_) {
    return false
  }
}

function writeReport(data: object): void {
  const filePath = './report.json'
  try {
    const json = JSON.stringify(data, null, 2)
    writeFileSync(filePath, json)
  } catch (_) {}
}

function makeDirectory(dest: string) {
  try {
    mkdirSync(dest, { recursive: true })
  } catch (_) {}
}

function relPath(importPath: string) {
  return join(moduleDirectory, importPath)
}

function virtualFileViews(router: Route[]) {
  const viewImports = router.map(({ component, filename }) => `import ${component} from "${filename}"`).join(';\n')
  const viewComponents = router.map(({ path, component }) => ({ path, component }))
  return `${viewImports}; export const viewComponents = ${JSON.stringify(viewComponents)};`
}

function virtualFileRoutesStatic(router: Route[]) {
  return `export default ${JSON.stringify(router.map((item) => ({ path: item.path, static: item.static })))};`
}

function virtualFilePage(idQualifiedPath: string, router: Route[]) {
  const route = router.find((item) => item.filename === idQualifiedPath)
  if (!route) {
    console.error({ idQualifiedPath, router })
    throw new Error('Failed to generate @page module for view state.')
  }
  return `import core from '@dxsvelte:router'
  const route = "${route.path}"
  export const ServerSideProps = core.serverDataStore[route].data
  export default { ServerSideProps }`
}

export function dxsvelte(proposed: ConfigOptions | null): Plugin[] {
  const config = evaluateConfig(proposed ?? null)
  const svelteConfig = reduceConfig(proposed ?? null)
  let router: Route[] = []

  const rfilesObj = {
    '@dxsvelte:app': relPath('./core-static/app.svelte'),
    '@dxsvelte:layout': relPath('./core-static/layout.svelte'),
    '@dxsvelte:router': relPath('./core-static/router.ts'),
    '@dxsvelte:csr': relPath('./core-static/entrypoint-csr.js'),
    '@dxsvelte:ssr': relPath('./core-static/entrypoint-ssr.js'),
    '@common': relPath('./core-static/common.ts')
  }

  const vfilesObj = {
    '@dxsvelte:routesStatic': (router: Route[]) => `export default ${JSON.stringify(router.map((item) => ({ path: item.path, static: item.static })))};`,
    '@dxsvelte:views': (router: Route[]) => {
      function makeComponentObj(path: string, component: string) {
        return `{ path: "${path}", component: ${component} }`
      }
      return `${router.map(({ component, filename }) => `import ${component} from "${filename}"`).join(';\n')}; export const viewComponents = [${router
        .map(({ path, component }) => makeComponentObj(path, component!))
        .join(', ')}];`
    }
  }

  return [
    {

      name: 'vite-dxsvelte',

      options(options: any) {
        router = getDjangoRouter(config)
        return options
      },

      resolveId(id: PropertyKey, importer: string | undefined, options: ResolveIdOptions) {
        if (typeof id !== 'string') {
          return undefined
        }

        if (id === '@dxsvelte:layout') {
          const mainLayoutPath = join(config.baseDirectory, config.mainApp, 'layout.svelte')
          try {
            if (existsSync(mainLayoutPath)) {
              return mainLayoutPath
            }
          } catch (_) {}
        }

        if (rfilesObj.hasOwnProperty(id)) {
          // @ts-expect-error
          return rfilesObj[id]
        }

        if (vfilesObj.hasOwnProperty(id)) {
          return id
        }

        // We handle the @page import resolution a little differently to the rest
        if (typeof importer !== 'string') {
          return undefined
        }
        const idQualifiedImporterPath = path.resolve(importer)
        if (id === '@page') {
          return `@page?${idQualifiedImporterPath}`
        }
      },

      load(id: string) {
        if (typeof id !== 'string') {
          return undefined
        }
        // Generate the @page modules
        if (id.startsWith('@page?')) {
          const idQualifiedPath = splitStringAfterQuestionMark(id)
          return virtualFilePage(idQualifiedPath, router)
        }

        // Handle the remainder of the virtual files here
        if (vfilesObj.hasOwnProperty(id)) {
          // @ts-expect-error
          return vfilesObj[id](router)
        }
      },

      async writeBundle(_: any, bundle: any) {
        const ssrBundle = Object.keys(bundle).find((key) => typeof key === 'string' && key.startsWith('assets/bundle.ssr') && key.endsWith('.js'))

        if (typeof ssrBundle === 'undefined') {
          return undefined
        }

        const outputDirectory = join(process.cwd(), `./${getMainAppName()}`)
        const outputFilePath = join(outputDirectory, 'bundle.ssr.js')
        const inputFilePath = join(process.cwd(), 'static', 'bundles', ssrBundle)

        makeDirectory(outputDirectory)
        try {
          unlinkSync(outputFilePath)
        } catch (_) {}

        await esbuild({
          entryPoints: [inputFilePath],
          bundle: true,
          format: 'esm',
          outfile: outputFilePath
        })

        try {
          unlinkSync(inputFilePath)
        } catch (_) {}
      }
    },
    svelte() as unknown as Plugin
  ]
}

export function defineBuild(options: any | null | undefined): ConfigOptions {
  const isBuild = process.argv.includes('build')

  if (typeof options === 'undefined' || options === null) {
    options = {}
  }
  
  if (typeof options.ssrParent !== 'string') {
    options.ssrParent = `./${getMainAppName()}`;
  }

  if (typeof options.rollupOptions === 'undefined' || options.rollupOptions === null) {
    options.rollupOptions = {}
  }

  if (isBuild && !options.rollupOptions.output) {
    options.rollupOptions.output = {}
    options.rollupOptions.output.dir = './static/bundles'
  }

  if (isBuild && !options.rollupOptions.input) {
    options.rollupOptions.input = {}
    options.rollupOptions.input['bundle.csr'] = '@dxsvelte:csr'
    options.rollupOptions.input['bundle.ssr'] = '@dxsvelte:ssr'
  }

  return options
}

export default { dxsvelte, defineBuild }
