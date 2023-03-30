import esbuild, { Plugin } from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import { join, resolve } from "path";
import { CompileOptions } from "svelte/types/compiler";
import { StdinOptions } from "esbuild";
import { __maindir, __basedir } from "../settings/config";

import { vfLoaderPlugin } from "./injector";
import { mkdirSync } from "fs";
import { posixSlash } from "./utils";

// This is where we 'redirect' @dxs import to the local *.dxs.ts file.
function svelteDataResolver(): Plugin {
  return {
    name: 'svelte-data-resolver',
    setup(build) {
      build.onResolve({ filter: /^@dxs$/ }, (args) => {
        const original = posixSlash(args.importer)
        const path = `${original}.dxs.vf.ts`
        console.log('Virtual @dxs: ', path)
        return {
          path
        };
      });
    },
  };
}

export function compile(
  entrypoint: string,
  vfLoaders: StdinOptions[],
  ver: "ssr" | "csr"
) {
  console.log(ver, entrypoint);
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
  };
  const compilerOptions = ver === "ssr" ? compileOptionsSsr : compileOptionsCsr;
  try {
    mkdirSync(join(__basedir, "static"));
  } catch (err) {}
  const outfile =
    ver === "ssr"
      ? join(__maindir, "svelte.ssr.js")
      : join(__basedir, "static", "svelte.csr.js");

  return esbuild
    .build({
      entryPoints: [entrypoint],
      mainFields: ["svelte", "browser", "module", "main"],
      bundle: true,
      outfile,
      format: "esm",
      plugins: [
        vfLoaderPlugin(vfLoaders, compilerOptions),
        svelteDataResolver(),
        esbuildSvelte({
          preprocess: [],
          compilerOptions,
        }),
      ],
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
