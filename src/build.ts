import esbuild from "esbuild";
import path from "path";
import { mkdirSync } from "fs";
import * as url from "url";
import { injectorPlugin } from "./compiler/injector";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

try {
  mkdirSync("./dist", { recursive: true });
} catch (err) {
  console.info("Distribution folder already exists; continuing.");
}

const external = [
  "require",
  "fs",
  "path",
  "esbuild",
  "url",
  "child_process",
  "svelte",
]

await esbuild
  .build({
    entryPoints: [path.join(__dirname, "entrypoint-init.ts")],
    mainFields: ["module", "node"],
    platform: "node",
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: "./dist/dxsvelte-init.js",
    format: "esm",
    plugins: [injectorPlugin()],
    external,
  })
  .catch(() => {
    console.error("Build failed for dxsvelte-init.js; exiting.");
    process.exit(1);
  });

await esbuild
  .build({
    entryPoints: [path.join(__dirname, "entrypoint-compiler.ts")],
    mainFields: ["module", "node"],
    platform: "node",
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: "./dist/dxsvelte-compiler.js",
    format: "esm",
    plugins: [injectorPlugin()],
    external,
  })
  .catch(() => {
    console.error("Build failed for dxsvelte-compiler.js; exiting.");
    process.exit(1);
  });

console.log("Build succeeded; exiting.");
