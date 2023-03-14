import esbuild from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import { join } from "path";
import { CompileOptions } from "svelte/types/compiler";
import { StdinOptions } from "esbuild";
import { __maindir, __basedir } from "../settings/config";

import { vfLoaderPlugin } from "./injector";
import { mkdirSync } from "fs";

export function compile(
  entrypoint: string,
  vfLoaders: StdinOptions[],
  ver: "ssr" | "csr"
) {
  console.log(ver, entrypoint)
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
  const compilerOptions = (ver === "ssr") ? compileOptionsSsr : compileOptionsCsr;
  try {
    mkdirSync(join(__basedir, "static"));
  } catch (err) {}
  const outfile =
    (ver === "ssr")
      ? join(__maindir, "svelte.ssr.js")
      : join(__basedir, "static", "svelte.csr.js");

  return esbuild
    .build({
      entryPoints: [entrypoint],
      mainFields: ["svelte", "browser", "module", "main"],
      bundle: true,
      //   outdir: "src",
      outfile,
      format: "esm",
      plugins: [
        vfLoaderPlugin(vfLoaders, compilerOptions),
        esbuildSvelte({
          preprocess: [],
          compilerOptions,
        }),
      ],
    })
    .catch(() => {
      const msg =
        (ver === "csr")
          ? "CSR Application Build Failed. Exiting."
          : "SSR Application Build Failed. Exiting.";
      console.error(msg);
      process.exit(1);
    });
}
