import esbuild, { Plugin } from "esbuild";
import esbuildSvelte from "esbuild-svelte";
// import postcssPlugin from "esbuild-plugin-postcss";
import { join } from "path";
import { CompileOptions } from "svelte/types/compiler";
import { StdinOptions } from "esbuild";
import { __maindir, __basedir, __cache } from "../settings/config";

import { vfLoaderPlugin } from "./injector";
import { mkdirSync, existsSync } from "fs";
import { posixSlash } from "./utils";
import { pathToFileURL } from 'url';


// This is where we 'redirect' @dxs import to the local *.dxs.ts file.
function svelteDataResolver(): Plugin {
  return {
    name: 'svelte-data-resolver',
    setup(build) {
      build.onResolve({ filter: /^@page$/ }, (args) => {
        const original = posixSlash(args.importer)
        const path = `${original}.page.vf.ts`
        console.log('Virtual @page: ', path)
        return {
          path
        };
      });
      build.onResolve({ filter: /^@common$/ }, () => {
        const path = posixSlash(join(__cache, "common.vf.ts"))
        return {
          path
        };
      });
    },
  };
}

export async function compile(
  entrypoint: string,
  vfLoaders: StdinOptions[],
  ver: "ssr" | "csr"
) {
  // Output the version being compiled
  console.log("Compiling...", ver, entrypoint);

  const compileOptionsCsr: CompileOptions = {
    generate: "dom",
    dev: false,
    format: "esm",
  };

  const compileOptionsSsr: CompileOptions = {
    generate: "ssr",
    dev: false,
    hydratable: true,
    format: "esm",
    css: true,
  };

  const compilerOptions = ver === "ssr" ? compileOptionsSsr : compileOptionsCsr;

  try {
    mkdirSync(join(__basedir, "static"));
  } catch (err) {}

  const outfile =
    ver === "ssr" ? join(__maindir, "svelte.ssr.js")
    : join(__basedir, "static", "svelte.csr.js")

  async function loadRootConfig(filePrefix: string): Promise<any> {
    const fextns = [
      filePrefix + '.js',
      filePrefix + '.mjs',
      filePrefix + '.cjs'
    ]
    const fnames = fextns.map(fname => join(__basedir, fname))
    const rootConfigFname = fnames.find(fname => existsSync(fname))
    if (!rootConfigFname) return []
    const rootConfigFnameString = pathToFileURL(rootConfigFname).toString()
    const rootConfigModule = await import(rootConfigFnameString)
    if (typeof rootConfigModule !== 'undefined') {
      console.log('Loaded ' + filePrefix)
      console.log(rootConfigModule)
      return rootConfigModule
    }
  }

  const svelteConfigModule = ver === "ssr" ? {preprocess: []} : await loadRootConfig('svelte.config')
  const preprocess = (svelteConfigModule?.preprocess) ? svelteConfigModule.preprocess : []
  const purgeCss = true
  
  const plugins = [
    vfLoaderPlugin(vfLoaders, compilerOptions),
    svelteDataResolver(),
    esbuildSvelte({
      preprocess,
      compilerOptions,
    })
  ]

  return esbuild
    .build({
      entryPoints: [entrypoint],
      mainFields: ["svelte", "browser", "module", "main"],
      bundle: true,
      outfile,
      format: "esm",
      plugins,
    })
    .catch(() => {
      const msg =
        ver === "csr"
          ? "CSR Application Build Failed. Exiting."
          : "SSR Application Build Failed. Exiting.";
      console.error(msg);
      process.exit(1);
    });
}
