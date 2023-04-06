// Roll-up the template files
//@ts-ignore
import layoutDefaultSvelte from "../svelte/templates/layout.$.svelte";
//@ts-ignore
import rootDefaultSvelte from "../svelte/templates/root.$.svelte";
//@ts-ignore
import entrypointSSR from "../svelte/templates/entrypoint-ssr.$.js";
//@ts-ignore
import entrypointCSR from "../svelte/templates/entrypoint-csr.$.js";

// Import the router script, component linkers, and common utils
//@ts-ignore
import routerDefault from "../client/router.$.ts";
//@ts-ignore
import linkerDefault from "../client/page.$.ts";
//@ts-ignore
import commonDefault from "../client/common.$.ts";

// General Imports
import type { Route } from "../resolver/routerTypes";
import { StdinOptions } from "esbuild";
import { existsSync } from "fs";
import { injectOptionsIntoString } from "./injector";
import { posixSlash } from "./utils";
import { join } from "path";
import {
  __basedir,
  __filename,
  __dirname,
  __cache,
  __main,
  __maindir,
} from "../settings/config";

// Construct the compiler data
export function constructCompiler(router: Route[]) {
  const vfLoaders: StdinOptions[] = [];

  function injectFile(sourcefile: string, contents: string) {
    const loaderParts = sourcefile.split(".");
    const loader = loaderParts[loaderParts.length - 1];
    const vfLoader = {
      contents,
      sourcefile,
      loader,
    };
    vfLoaders.push(vfLoader as StdinOptions);
  }

  // Construct the Layout import line; if the user's one doesn't exist, import the virtual one and change the fname
  let fnameLayout = posixSlash(join(__maindir, "layout.svelte"));
  if (!existsSync(fnameLayout)) {
    fnameLayout = posixSlash(join(__maindir, "layout.vf.svelte"));
    injectFile(fnameLayout, layoutDefaultSvelte as unknown as string);
  }

  // Construct the Root component from the resolved router data
  const fnameRoot = posixSlash(join(__cache, "root.vf.svelte"));
  const layoutImportStatement = `import Layout from '${fnameLayout}'`;
  // Statement constructors
  const routeImports = (route: Route) =>
    `import ${route.component} from '${route.filename}'`;
  const routeIfs = (route: Route) =>
    `{#each trigger as instance}{#if satisfiedStorePath(currentView) === '${route.path}'}<${route.component}></${route.component}>{/if}{/each}`;

  const svelteComponentImportsArr = router.map((route) => routeImports(route));
  const svelteComponentsIfsArr = router.map((route) => routeIfs(route));

  const svelteComponentImports = svelteComponentImportsArr.join("\n");
  const svelteComponentsIfs = svelteComponentsIfsArr.join("\n");

  // Router Imports
  const strRouterArray = JSON.stringify(router.map((route) => route.path));
  const fnameRouter = posixSlash(join(__maindir, "router.vf.ts"));
  const configuredRouter = injectOptionsIntoString(
    { router: strRouterArray },
    routerDefault as unknown as string
  );
  injectFile(fnameRouter, configuredRouter);

  const rootSvelte = injectOptionsIntoString(
    {
      router: fnameRouter,
      layoutImportStatement,
      svelteComponentImports,
      svelteComponentsIfs,
    },
    rootDefaultSvelte as unknown as string
  );

  // Inject a local .page.vf.ts for each route component
  const routeLinker = (route: Route) => {
    const conf = {
      path: route.path,
      fnameRouter,
    };
    const linkerLocalised = injectOptionsIntoString(conf, linkerDefault as unknown as string);
    const fname = `${route.filename}.page.vf.ts`;
    injectFile(fname, linkerLocalised);
  };

  router.map((route) => routeLinker(route));

  // Inject the Common utils
  const fnameCommon = posixSlash(join(__cache, "common.vf.ts"))
  const configuredCommon = injectOptionsIntoString(
    { fnameRouter },
    commonDefault as unknown as string
  );
  injectFile(fnameCommon, configuredCommon);

  // Create the Svelte App import strings for the entrypoint files and inject them into the files
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

  injectFile(fnameRoot, rootSvelte);
  injectFile(entrypointSSRPath, configuredEntrypointSSR);
  injectFile(entrypointCSRPath, configuredEntrypointCSR);

  return {
    vfLoaders,
    entrypointSSRPath,
    entrypointCSRPath,
  };
}
