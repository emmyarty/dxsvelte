import { readFileSync } from "fs";
import type { Loader, Plugin, PluginBuild, StdinOptions } from "esbuild";
import { resolve } from "path";
import { compile } from "svelte/compiler";
import { CompileOptions } from "svelte/types/compiler";

export interface Opts {
  [key: string]: string;
}

export function injectOptionsIntoString(opts: Opts, document: string): string {
  Object.keys(opts).forEach((key) => {
    const regexOpt = new RegExp(`{{${key}}}`, "g");
    const regexOptOmit = new RegExp(`{{!${key}}}`, "g");
    document = document.replace(regexOpt, opts[key]);
    document = document.replace(regexOptOmit, `{{${key}}}`);
  });
  return document;
}

export function injectorPlugin(opts: Opts = {}): Plugin {
  return {
    name: "document-injector",
    setup(build) {
      build.onLoad({ filter: /\.\$\.[\S]+$/ }, async (args) => {
        const document = readFileSync(args.path, "utf8");
        const injected = injectOptionsIntoString(opts, document);
        const suffix = args.path.split(".").pop()! as Loader;
        const contents = `export default ${JSON.stringify(injected)};`;
        return {
          contents,
          loader: "js" as Loader,
        };
      });
    },
  };
}

function isolateLoader(
  requested: string,
  loaders: StdinOptions[]
): StdinOptions | null {
  const resolvedRequest = resolve(requested);
  return (
    loaders.find((item) => resolve(item.sourcefile!) === resolvedRequest) ??
    null
  );
}

export function vfLoaderPlugin(loaders: StdinOptions[] = [], compileOptions: CompileOptions): Plugin {
  return {
    name: "virtual-file-injector",
    setup(build) {
      build.onResolve({ filter: /\.vf\.[\S]+$/ }, async (args) => {
        // console.log("VF Resolved: " + args.path);
        return { path: args.path };
      });
      build.onLoad({ filter: /\.vf\.[\S]+$/ }, async (args) => {
        const currentDocument = isolateLoader(args.path, loaders);
        const contents = currentDocument!.contents;
        const loader = currentDocument!.loader as Loader;

        // Compile the vf with Svelte's compiler, if applicable
        //@ts-ignore
        if (loader === 'svelte') {
          const compiledObj = compile(contents as string, compileOptions);
          const compiledJs = compiledObj?.js?.code ?? null
          if (!compiledJs) {
            throw new Error('Compilation Failed for: ' + args.path)
          }
          return { contents: compiledJs, loader: 'js' };
        }
        return {
          contents,
          loader,
        };
      });
    },
  };
}
