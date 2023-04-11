// import sourceMap from "source-map-support";
import { getRouter } from './resolver/routerResolver'
import {
  __basedir,
  __filename,
  __dirname,
  __cache,
  __main,
  __maindir,
  prepareSvCache,
  cleanSvCache
} from './settings/config'
import { constructCompiler } from './compiler/collate'
import { compile } from './compiler/compile'
import { triggerRestart } from './compiler/restart'

// Initialise the cache folder
prepareSvCache()

// Get the resolved and translated router object from the Django application
const router = getRouter()
const compilerConf = constructCompiler(router)

// Debug output
console.dir(router)

// Compile the user's application
await compile(compilerConf.entrypointSSRPath, compilerConf.vfLoaders, 'ssr')
await compile(compilerConf.entrypointCSRPath, compilerConf.vfLoaders, 'csr')

// Clean up the cache folder. Sometimes commented out for debugging, need to implement debug flags
cleanSvCache()
triggerRestart()
