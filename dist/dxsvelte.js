// src/dxsvelte.ts
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { build as esbuild } from "esbuild";

// src/django.ts
import { spawnSync } from "child_process";
import { join } from "path";
var routerResolverPy = String.raw`#!/usr/bin/python3
import os
import sys
import django
from django.urls import get_resolver, URLPattern, URLResolver
from django.urls.resolvers import RoutePattern
import json
import base64
import re

sys.path.append(os.getcwd())

with open('manage.py', 'r') as f:
    manage_py_content = f.read()

pattern = r"os\.environ\.setdefault\(['\"]DJANGO_SETTINGS_MODULE['\"]\s*,\s*(['\"].+['\"])"
match = re.search(pattern, manage_py_content)
project_settings = match.group(1).strip('"').strip("'")

os.environ.setdefault('DJANGO_SETTINGS_MODULE', project_settings)
django.setup()

delimiter = '===DXSVELTE_DELIMITER==='

def get_urls_json():
    resolver = get_resolver()
    url_patterns = []

    class DjangoJSONEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, RoutePattern):
                return str(obj)
            elif isinstance(obj, re.Pattern):
                return obj.pattern
            elif hasattr(obj, '__dict__'):
                return vars(obj)
            return super().default(obj)

    def strip_prefix(obj):
        text = str(obj)
        regex = '\w+(\.\w+)*(?= at|\sof)'
        output = ""
        match = re.search(regex, text)
        if match != None:
            output = match.group()
        return output

    def get_app_path(url_resolver):
        if isinstance(url_resolver, URLResolver) and url_resolver.url_patterns and len(url_resolver.url_patterns) > 0 and isinstance(url_resolver.url_patterns[0], URLPattern):
            return url_resolver.url_patterns[0].lookup_str.split('.')[0]
        else:
            return None

    def has_static_view_decorator(func):
        return hasattr(func, 'is_static_view') and func.is_static_view

    def convert_url_pattern(pattern):
        if hasattr(pattern, 'url_patterns'):
            # URLResolver
            return {
                'type': 'resolver',
                'app_name': pattern.app_name,
                'namespace': pattern.namespace,
                'url_patterns': [convert_url_pattern(p) for p in pattern.url_patterns],
                'prefix': pattern.pattern,
                'app_path': get_app_path(pattern)
            }
        else:
            # URLPattern
            return {
                'type': 'pattern',
                'pattern': pattern.pattern,
                'name': pattern.name,
                'lookup_str': pattern.lookup_str,
                'callback': strip_prefix(pattern.callback),
                'static_view': has_static_view_decorator(pattern.callback)
            }

    for pattern in resolver.url_patterns:
        url_patterns.append(convert_url_pattern(pattern))

    return json.dumps(url_patterns, cls=DjangoJSONEncoder)

output = get_urls_json()
encoded_output = base64.b64encode(output.encode('utf-8')).decode('utf-8')

sys.stdout.write(f'{delimiter}{encoded_output}{delimiter}')
sys.stdout.flush()`;
function extract(str) {
  const delimiter = "===DXSVELTE_DELIMITER===";
  const regex = new RegExp(`${delimiter}(.*?)${delimiter}`);
  const match = str.match(regex);
  if (typeof match === "undefined" || match === null) {
    throw new Error("Router resolver Python response mangled.");
  }
  return match[1];
}
function runPythonResolverScript(config) {
  const command = config.python ?? "python3";
  const { stdout, stderr, status } = spawnSync(process.env.SHELL, ["-c", command], { input: routerResolverPy, encoding: "utf-8" });
  if (status === 0) {
    try {
      const encodedJsonString = extract(stdout);
      const encodedJsonBuffer = Buffer.from(encodedJsonString, "base64");
      const decodedJsonBuffer = encodedJsonBuffer.toString("utf-8");
      return decodedJsonBuffer;
    } catch (err) {
      console.error(err);
      throw new Error("Django resolver failed to produce a valid object.");
    }
  } else {
    throw new Error(stderr.trim());
  }
}
function getRouterResolver(config) {
  try {
    const routerJsonString = runPythonResolverScript(config);
    const routerJsonObj = JSON.parse(routerJsonString);
    return routerJsonObj;
  } catch (err) {
    console.error(err);
    throw new Error("Could Not Load Django Router Object");
  }
}
function posixSlash(str) {
  if (!str)
    return str;
  return str.replace(/\\/g, "/");
}
function formatSvelteComponentFilepath(parent, str, config) {
  if (str.length < 2) {
    throw new Error(`${str} is not a valid component file.`);
  }
  const fname = `${str.slice(1)}.svelte`;
  return posixSlash(join(config.baseDirectory, parent, config.views ?? "views", fname));
}
function formatSvelteComponentTagName(str) {
  if (str.length < 2)
    return str;
  return str.charAt(1).toUpperCase() + str.slice(2).replace("$", "");
}
function capitaliseTagName(str) {
  if (str.length === 0)
    return str;
  let ret = str.charAt(0).toUpperCase();
  if (str.length === 1)
    return ret;
  return ret + str.slice(1);
}
function constructPathFromSegments(...segments) {
  const path2 = segments.join("/");
  const cleanPath = path2.replace(/\/\/+/g, "/");
  const trimmedPath = cleanPath.replace(/^\/|\/$/g, "");
  return "/" + trimmedPath;
}
function translateDjangoResolver(input, config) {
  const { mainApp, baseDirectory: baseDirectory2 } = config;
  if (typeof mainApp !== "string" || typeof baseDirectory2 !== "string") {
    throw new Error("Malformed configuration in DxSvelte config.");
  }
  const router = [];
  const traverse = (parent, data) => {
    if (data.type === "resolver") {
      if (!Array.isArray(data.url_patterns))
        return null;
      data.url_patterns.map((item) => {
        traverse({ ...data }, item);
      });
    }
    if (data.type === "pattern") {
      if (!parent || !parent.app_path) {
        parent = {
          app_path: mainApp,
          type: "resolver",
          prefix: ""
        };
      }
      if (!parent || !parent.app_path || typeof data.pattern !== "string" || !data.name || data.name[0] !== "$")
        return null;
      const route = {
        app: parent.app_path,
        path: parent.prefix ? constructPathFromSegments(parent.prefix, data.pattern) : constructPathFromSegments(data.pattern),
        view: data.name ?? null,
        static: data.static_view,
        component: data.name ? capitaliseTagName(parent.app_path) + formatSvelteComponentTagName(data.name) : null,
        filename: data.name && parent.app_path ? formatSvelteComponentFilepath(parent.app_path, data.name, config) : null
      };
      router.push(route);
    }
  };
  if (!Array.isArray(input))
    return router;
  input.map((item) => traverse(null, item));
  return router;
}
function getDjangoRouter(config) {
  const resolvedRouter = getRouterResolver(config);
  const translatedRouter = translateDjangoResolver(resolvedRouter, config ?? null);
  return translatedRouter;
}

// src/python.ts
import { execSync as execSync2 } from "child_process";
import { readFileSync } from "fs";
import { join as join2 } from "path";
var pythonCmd = null;
var pipCmd = null;
function checkPythonVersion(command) {
  try {
    const stdout = execSync2(`${command} -V 2>/dev/null`, {
      encoding: "utf-8",
      shell: process.env.SHELL
    });
    const match = stdout.match(/\d+\.\d+\.\d+/);
    if (match === null)
      return false;
    const version = match[0];
    const [major, minor, patch] = version.split(".").map(Number);
    if (major < 3)
      return false;
    if (major > 3)
      return [version, command];
    if (minor < 10)
      return false;
    if (minor > 10)
      return [version, command];
    if (patch < 7)
      return false;
    return [version, command];
  } catch (error) {
    return false;
  }
}
function initPythonCommands() {
  const commands = ["python", "python3", "python3.11", "python3.10", "python3.12"];
  for (let command of commands) {
    const versionArr = checkPythonVersion(command);
    if (versionArr) {
      pythonCmd = versionArr[1];
      if (pythonCmd) {
        pipCmd = pythonCmd.replace("ython", "ip");
      }
      return void 0;
    }
  }
  throw new Error("A supported version of Python is not installed.");
}
function getPythonCommand() {
  if (!pythonCmd) {
    initPythonCommands();
  }
  return pythonCmd;
}

// src/dxsvelte.ts
import { promises, readFileSync as readFileSync2, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { unlinkSync, promises as fsPromises } from "fs";
import { join as join3 } from "path";
import * as path from "path";
var { stat } = promises;
var moduleDirectory = dirname(fileURLToPath(import.meta.url));
var baseDirectory = resolve(process.cwd());
var mainAppName = null;
function initMainAppName() {
  const rxFunctionString = /os\.environ\.setdefault\(\s*("DJANGO_SETTINGS_MODULE"|'DJANGO_SETTINGS_MODULE')\s*,\s*("(.+)\.settings"|'(.+)\.settings')\)/;
  const settingsStr = readFileSync2(join3(baseDirectory, "manage.py"), "utf8");
  const settingsStrExtract = settingsStr.match(rxFunctionString) ?? [];
  const settingsModuleExtract = settingsStrExtract?.length > 3 ? settingsStrExtract[2].replaceAll('"', "").replaceAll("'", "") : "";
  if (settingsModuleExtract === "") {
    throw new Error("Could not extract settings from manage.py. Exiting.");
  }
  const mainModuleExtract = settingsModuleExtract.split(".");
  const mainModuleStr = mainModuleExtract[0];
  mainAppName = mainModuleStr;
}
function getMainAppName() {
  if (!mainAppName) {
    initMainAppName();
  }
  return mainAppName;
}
function evaluateConfig(proposed) {
  const config = {};
  if (proposed === null) {
    proposed = {};
  }
  config.python = proposed.python ?? getPythonCommand() ?? "python3";
  config.django = proposed.django ?? `${config.python} ./manage.py runserver 0.0.0.0:8000`;
  config.baseDirectory = proposed.baseDirectory ?? resolve(process.cwd());
  config.mainApp = proposed.mainApp ?? getMainAppName();
  config.views = proposed.views ?? "views";
  return config;
}
function reduceConfig(proposed) {
  if (!proposed) {
    return void 0;
  }
  const dxsvelteConfigKeys = ["python", "django", "baseDirectory", "mainApp", "views"];
  dxsvelteConfigKeys.forEach((key) => {
    if (key in proposed) {
      delete proposed[key];
    }
  });
  return proposed;
}
function splitStringAfterQuestionMark(str) {
  const index = str.indexOf("?");
  return index >= 0 ? str.slice(index + 1) : "";
}
function makeDirectory(dest) {
  try {
    mkdirSync(dest, { recursive: true });
  } catch (_) {
  }
}
function relPath(importPath) {
  return join3(moduleDirectory, importPath);
}
function virtualFilePage(idQualifiedPath, router) {
  const route = router.find((item) => item.filename === idQualifiedPath);
  if (!route) {
    console.error({ idQualifiedPath, router });
    throw new Error("Failed to generate @page module for view state.");
  }
  return `import core from '@dxsvelte:router'
  const route = "${route.path}"
  export const ServerSideProps = core.serverDataStore[route].data
  export default { ServerSideProps }`;
}
function dxsvelte(proposed) {
  const config = evaluateConfig(proposed ?? null);
  const svelteConfig = reduceConfig(proposed ?? null);
  let router = [];
  const rfilesObj = {
    "@dxsvelte:app": relPath("./core-static/app.svelte"),
    "@dxsvelte:layout": relPath("./core-static/layout.svelte"),
    "@dxsvelte:router": relPath("./core-static/router.ts"),
    "@dxsvelte:csr": relPath("./core-static/entrypoint-csr.js"),
    "@dxsvelte:ssr": relPath("./core-static/entrypoint-ssr.js"),
    "@common": relPath("./core-static/common.ts")
  };
  const vfilesObj = {
    "@dxsvelte:routesStatic": (router2) => `export default ${JSON.stringify(router2.map((item) => ({ path: item.path, static: item.static })))};`,
    "@dxsvelte:views": (router2) => {
      function makeComponentObj(path2, component) {
        return `{ path: "${path2}", component: ${component} }`;
      }
      return `${router2.map(({ component, filename }) => `import ${component} from "${filename}"`).join(";\n")}; export const viewComponents = [${router2.map(({ path: path2, component }) => makeComponentObj(path2, component)).join(", ")}];`;
    }
  };
  return [
    {
      name: "vite-dxsvelte",
      options(options) {
        router = getDjangoRouter(config);
        return options;
      },
      resolveId(id, importer, options) {
        if (typeof id !== "string") {
          return void 0;
        }
        if (id === "@dxsvelte:layout") {
          const mainLayoutPath = join3(config.baseDirectory, config.mainApp, "layout.svelte");
          try {
            if (existsSync(mainLayoutPath)) {
              return mainLayoutPath;
            }
          } catch (_) {
          }
        }
        if (rfilesObj.hasOwnProperty(id)) {
          return rfilesObj[id];
        }
        if (vfilesObj.hasOwnProperty(id)) {
          return id;
        }
        if (typeof importer !== "string") {
          return void 0;
        }
        const idQualifiedImporterPath = path.resolve(importer);
        if (id === "@page") {
          return `@page?${idQualifiedImporterPath}`;
        }
      },
      load(id) {
        if (typeof id !== "string") {
          return void 0;
        }
        if (id.startsWith("@page?")) {
          const idQualifiedPath = splitStringAfterQuestionMark(id);
          return virtualFilePage(idQualifiedPath, router);
        }
        if (vfilesObj.hasOwnProperty(id)) {
          return vfilesObj[id](router);
        }
      },
      async writeBundle(_, bundle) {
        const ssrBundle = Object.keys(bundle).find((key) => typeof key === "string" && key.startsWith("assets/bundle.ssr") && key.endsWith(".js"));
        if (typeof ssrBundle === "undefined") {
          return void 0;
        }
        const outputDirectory = join3(process.cwd(), `./${getMainAppName()}`);
        const outputFilePath = join3(outputDirectory, "bundle.ssr.js");
        const inputFilePath = join3(process.cwd(), "static", "bundles", ssrBundle);
        makeDirectory(outputDirectory);
        try {
          unlinkSync(outputFilePath);
        } catch (_2) {
        }
        await esbuild({
          entryPoints: [inputFilePath],
          bundle: true,
          format: "esm",
          outfile: outputFilePath
        });
        try {
          unlinkSync(inputFilePath);
        } catch (_2) {
        }
      }
    },
    svelte()
  ];
}
function defineBuild(options) {
  const isBuild = process.argv.includes("build");
  if (typeof options === "undefined" || options === null) {
    options = {};
  }
  if (typeof options.ssrParent !== "string") {
    options.ssrParent = `./${getMainAppName()}`;
  }
  if (typeof options.rollupOptions === "undefined" || options.rollupOptions === null) {
    options.rollupOptions = {};
  }
  if (isBuild && !options.rollupOptions.output) {
    options.rollupOptions.output = {};
    options.rollupOptions.output.dir = "./static/bundles";
  }
  if (isBuild && !options.rollupOptions.input) {
    options.rollupOptions.input = {};
    options.rollupOptions.input["bundle.csr"] = "@dxsvelte:csr";
    options.rollupOptions.input["bundle.ssr"] = "@dxsvelte:ssr";
  }
  return options;
}
var dxsvelte_default = { dxsvelte, defineBuild };
export {
  dxsvelte_default as default,
  defineBuild,
  dxsvelte
};
//# sourceMappingURL=dxsvelte.js.map
