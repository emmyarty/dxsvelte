// @ts-ignore
import dxsvelteTemplate from "./dxsvelte.$.py";
// @ts-ignore
import packageJsonTemplate from "./package.$.json";
// @ts-ignore
import tsconfigJsonTemplate from "./tsconfig.$.json";
import { existsSync, writeFileSync } from "fs";
import { __basedir, __main } from "../settings/config";
import { injectOptionsIntoString } from "../compiler/injector";
import type { Opts } from "../compiler/injector";
import { join } from "path";

function isInstalled(file: string) {
  const fname = join(__basedir, file);
  return existsSync(fname);
}

function getPath(file: string) {
  return join(__basedir, file);
}

function installConditional(fname: string, document: string, opts: Opts = {}) {
  function printErr(fname: string){
    console.error(`Could not install ${fname}. If the file already exists from a previous init, ignore this error.`);
  }
  if (!isInstalled(fname)) {
    try {
      const configuredFile = injectOptionsIntoString(opts, document);
      writeFileSync(getPath(fname), configuredFile);
    } catch (err) {
      printErr(fname)
    }
  } else {
    printErr(fname)
  }
}

export function installRootFiles() {
  installConditional("dxsvelte.py", dxsvelteTemplate, { __main });
  installConditional("package.json", packageJsonTemplate, { __main });
  installConditional("tsconfig.json", tsconfigJsonTemplate, { __main });
}