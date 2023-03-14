// Roll-up the template files
//@ts-ignore
import layoutDefaultSvelte from "../svelte/templates/layout.$.svelte";
//@ts-ignore
import rootDefaultSvelte from "../svelte/templates/root.$.svelte";
//@ts-ignore
import entrypointSSR from "../svelte/templates/entrypoint-ssr.$.js";
//@ts-ignore
import entrypointCSR from "../svelte/templates/entrypoint-csr.$.js";

// Import the router script
//@ts-ignore
import routerDefault from "../client/router.$.js";

// Compiler Import
import { compile } from "./compile";

// General Imports
import type { Route } from "../resolver/routerTypes";
import esbuild from "esbuild";
import { StdinOptions } from "esbuild";
import { existsSync } from "fs";
import { injectOptionsIntoString } from "./injector";
import { posixSlash } from "./utils";
import { join, resolve } from "path";
import {
  __basedir,
  __filename,
  __dirname,
  __cache,
  __main,
  __maindir,
  cache,
} from "../settings/config";

// Construct the compiler data
export function constructCompiler(router: Route[]) {
  const vfLoaders: StdinOptions[] = [];

  function injectFile(sourcefile: string, contents: string) {
    // const sourcefileParts = sourcefile.match(/\.(.+)$/);
    const loaderParts = sourcefile.split(".");
    const loader = loaderParts[loaderParts.length - 1];
    // sourcefileParts && Array.isArray(sourcefileParts) ? sourcefileParts[sourcefileParts.length - 1] : "js";
    const vfLoader = {
      contents,
      sourcefile,
      loader,
    };
    //@ts-ignore
    vfLoaders.push(vfLoader);
  }

  // Construct the Layout import line; if the user's one doesn't exist, import the virtual one and change the fname
  let fnameLayout = posixSlash(join(__maindir, "layout.svelte"));
  if (!existsSync(fnameLayout)) {
    fnameLayout = posixSlash(join(__maindir, "layout.vf.svelte"));
    //@ts-ignore
    injectFile(fnameLayout, layoutDefaultSvelte);
  }

  // Construct the Root component from the resolved router data
  const fnameRoot = posixSlash(join(__cache, "root.vf.svelte"));
  const layoutImportStatement = `import Layout from '${fnameLayout}'`;
  // Statement constructors
  const routeImports = (route: Route) =>
    `import ${route.component} from '${route.filename}'`;
  const routeIfs = (route: Route) =>
    `{#if currentRoute === '${route.path}'}<${route.component}></${route.component}>{/if}`;

  const svelteComponentImportsArr = router.map((route) => routeImports(route));
  const svelteComponentsIfsArr = router.map((route) => routeIfs(route));

  const svelteComponentImports = svelteComponentImportsArr.join("\n");
  const svelteComponentsIfs = svelteComponentsIfsArr.join("\n");

  // Router Imports
  const strRouterArray = JSON.stringify(router.map((route) => route.path));
  const fnameRouter = posixSlash(join(__maindir, "router.vf.js"));
  const configuredRouter = injectOptionsIntoString(
    { router: strRouterArray },
    // { router: '["/", "/sample/about", "/sample"]' },
    //@ts-ignore
    routerDefault
  );
  //@ts-ignore
  injectFile(fnameRouter, configuredRouter);

  const rootSvelte = injectOptionsIntoString(
    {
      router: fnameRouter,
      layoutImportStatement,
      svelteComponentImports,
      svelteComponentsIfs,
    },
    //@ts-ignore
    rootDefaultSvelte
  );

  // Create the Svelte App import strings for the entrypoint files
  // const App = `${posixSlash(join(__cache, ))}`;

  // Inject them into the files
  const configuredEntrypointSSR = injectOptionsIntoString(
    { App: fnameRoot },
    entrypointSSR
  );
  const configuredEntrypointCSR = injectOptionsIntoString(
    { App: fnameRoot },
    entrypointCSR
  );

  // Create the entrypoint file paths
  const entrypointSSRPath = `${posixSlash(join(__cache, "ssr.vf.js"))}`;
  const entrypointCSRPath = `${posixSlash(join(__cache, "csr.vf.js"))}`;

  //@ts-ignore
  injectFile(fnameRoot, rootSvelte);

  //@ts-ignore
  injectFile(entrypointSSRPath, configuredEntrypointSSR);

  //@ts-ignore
  injectFile(entrypointCSRPath, configuredEntrypointCSR);

  return {
    vfLoaders,
    entrypointSSRPath,
    entrypointCSRPath,
  };
}
