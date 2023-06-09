// import sourceMap from "source-map-support";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, unlinkSync } from "fs";
import { join, resolve } from "path";
import { getPythonVersion } from './pythonVersion'
import * as url from "url";

export const cache = "__svcache__";
export const pythonCmd = await getPythonVersion();
export const __basedir = resolve(process.cwd());
export const __filename = url.fileURLToPath(import.meta.url);
export const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
export const __cache = join(__basedir, cache);

// Must verify the current working directory before continuing with configuration.
const runningInProjectRoot = existsSync(join(__basedir, "manage.py"));
if (!runningInProjectRoot) {
  console.error(
    "This script must be run from the Django project's root directory. Exiting."
  );
  process.exit(1);
}
console.log(`${__basedir} is a Django project directory. Continuing.`);

export const app_name = getMainApp();
export const __main = getMainApp();
export const __maindir = join(__basedir, __main);

export function getMainApp() {
  const rxFunctionString =
    /os\.environ\.setdefault\(\s*("DJANGO_SETTINGS_MODULE"|'DJANGO_SETTINGS_MODULE')\s*,\s*("(.+)\.settings"|'(.+)\.settings')\)/;
  const settingsStr = readFileSync(join(__basedir, "manage.py"), "utf8");
  const settingsStrExtract = settingsStr.match(rxFunctionString) ?? [];
  const settingsModuleExtract =
    settingsStrExtract?.length > 3 ? settingsStrExtract[2].replaceAll('"',"").replaceAll("'","") : "";
  if (settingsModuleExtract === "") {
    throw new Error("Could not extract settings from manage.py. Exiting.");
  }
  const mainModuleExtract = settingsModuleExtract.split(".");
  const mainModuleStr = mainModuleExtract[0];
  return mainModuleStr;
}

export function prepareSvCache() {
  if (!existsSync(__cache)) {
    mkdirSync(__cache, { recursive: true });
  } else {
    const files = readdirSync(__cache);
    files.forEach((file) => {
      const filePath = join(__cache, file);
      unlinkSync(filePath);
    });
  }
}

export function cleanSvCache() {
  const files = readdirSync(__cache);
  files.forEach((file) => {
    const filePath = join(__cache, file);
    unlinkSync(filePath);
  });
  rmSync(__cache, { recursive: true, force: true});
  console.log(`Cleaned ${cache} artefacts.`);
}

export default {
  app_name,
  cache,
  pythonCmd,
  __basedir,
  __filename,
  __dirname,
  __cache,
  __main,
  __maindir,
  prepareSvCache,
  cleanSvCache
};
