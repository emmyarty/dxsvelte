#!/usr/bin/env node


// src/configurator.ts
import inquirer from "inquirer";

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright color
    blackBright: [90, 39],
    gray: [90, 39],
    // Alias of `blackBright`
    grey: [90, 39],
    // Alias of `blackBright`
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright color
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    // Alias of `bgBlackBright`
    bgGrey: [100, 49],
    // Alias of `bgBlackBright`
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = /* @__PURE__ */ new Map();
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          /* eslint-disable no-bitwise */
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
          /* eslint-enable no-bitwise */
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "node:process";
import os from "node:os";
import tty from "node:tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = process2;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function envForceColor() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== void 0) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === void 0) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process2.platform === "win32") {
    const osRelease = os.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if ("GITHUB_ACTIONS" in env) {
      return 3;
    }
    if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
    endIndex = index + 1;
    index = string.indexOf("\n", endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
var styles2 = /* @__PURE__ */ Object.create(null);
var applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === void 0 ? colorLevel : options.level;
};
var chalkFactory = (options) => {
  const chalk2 = (...strings) => strings.join(" ");
  applyOptions(chalk2, options);
  Object.setPrototypeOf(chalk2, createChalk.prototype);
  return chalk2;
};
function createChalk(options) {
  return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === "rgb") {
    if (level === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles2[bgModel] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
var proto = Object.defineProperties(() => {
}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level) {
      this[GENERATOR].level = level;
    }
  }
});
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === void 0) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === void 0) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== void 0) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf("\n");
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// src/configurator.ts
import figlet from "figlet";
import { execSync as execSync2 } from "child_process";
import { basename, join as join2, dirname } from "path";
import { fileURLToPath } from "url";
import { statSync, readFileSync as readFileSync2, copyFileSync, writeFileSync, appendFileSync } from "fs";

// src/python.ts
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
var pythonCmd = null;
var pipCmd = null;
function checkPythonVersion(command) {
  try {
    const stdout = execSync(`${command} -V 2>/dev/null`, {
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
function getPipCommand() {
  if (!pipCmd) {
    initPythonCommands();
  }
  return pipCmd;
}
var mainApp = null;
function initMainAppName() {
  const rxFunctionString = /os\.environ\.setdefault\(\s*("DJANGO_SETTINGS_MODULE"|'DJANGO_SETTINGS_MODULE')\s*,\s*("(.+)\.settings"|'(.+)\.settings')\)/;
  const settingsStr = readFileSync(join(process.cwd(), "manage.py"), "utf8");
  const settingsStrExtract = settingsStr.match(rxFunctionString) ?? [];
  const settingsModuleExtract = settingsStrExtract?.length > 3 ? settingsStrExtract[2].replaceAll('"', "").replaceAll("'", "") : "";
  if (settingsModuleExtract === "") {
    throw new Error("Could not extract settings from manage.py. Exiting.");
  }
  const mainModuleExtract = settingsModuleExtract.split(".");
  const mainModuleStr = mainModuleExtract[0];
  mainApp = mainModuleStr;
  return void 0;
}
function getMainAppName() {
  if (!mainApp) {
    initMainAppName();
  }
  return mainApp;
}

// src/configurator.ts
var moduleDirectory = dirname(fileURLToPath(import.meta.url));
var maindir = process.cwd();
var debug = false;
try {
  const args = process.argv.slice(2);
  if (typeof args !== "undefined" && Array.isArray(args) && args.includes("--debug")) {
    debug = true;
  }
} catch (_) {
}
function getFullPath(file) {
  const pathSegments = debug ? [maindir, "debug", file] : [maindir, file];
  return join2(...pathSegments);
}
function checkFileExists(filePath) {
  try {
    const result = statSync(filePath);
    if (result)
      return true;
    return false;
  } catch (_) {
    return false;
  }
}
function isObj(obj) {
  if (typeof obj !== "object")
    return false;
  if (Array.isArray(obj))
    return false;
  if (obj === null)
    return false;
  return true;
}
async function getExistingJson(fpath) {
  try {
    const file = readFileSync2(fpath, "utf8");
    const json = JSON.parse(file);
    if (!isObj(json)) {
      const fname = basename(fpath);
      throw new Error(`File ${fname} is not valid. Skipping config.`);
    }
    return json;
  } catch (err) {
    const fileExists = checkFileExists(fpath);
    if (fileExists) {
      const fname = basename(fpath);
      console.error(`File ${fname} is not valid. Skipping config.`);
      throw err;
    }
    return {};
  }
}
function constructUpdatedTsconfig(obj) {
  const compilerOptionsCore = {
    target: "ES2022",
    allowJs: true,
    skipLibCheck: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    strict: true,
    forceConsistentCasingInFileNames: true,
    noFallthroughCasesInSwitch: true,
    module: "ES2022",
    moduleResolution: "node",
    noEmit: true,
    baseUrl: "."
  };
  const compilerOptionsPathsInclude = {
    "@page": ["node_modules/dxsvelte/dist/client-types/@page.ts"],
    "@common": ["node_modules/dxsvelte/dist/client-types/@common.ts"]
  };
  const compilerOptionsPathsOmit = [];
  if (!isObj(obj.compilerOptions))
    obj.compilerOptions = {};
  obj.compilerOptions = { ...obj.compilerOptions, ...compilerOptionsCore };
  if (typeof obj.compilerOptions.lib === "string")
    obj.compilerOptions.lib = [obj.compilerOptions.lib];
  if (typeof obj.compilerOptions.lib === "undefined" || !Array.isArray(obj.compilerOptions.lib))
    obj.compilerOptions.lib = [];
  if (!obj.compilerOptions.lib.includes("ES2022"))
    obj.compilerOptions.lib.push("ES2022");
  if (!obj.compilerOptions.lib.includes("dom"))
    obj.compilerOptions.lib.push("dom");
  if (typeof obj.compilerOptions.paths === "undefined")
    obj.compilerOptions.paths = {};
  obj.compilerOptions.paths = {
    ...obj.compilerOptions.paths,
    ...compilerOptionsPathsInclude
  };
  compilerOptionsPathsOmit.map((key) => obj.compilerOptions.paths[key] ? delete obj.compilerOptions.paths[key] : null);
  if (typeof obj.types === "undefined")
    obj.types = [];
  if (typeof obj.types === "string")
    obj.types = [obj.types];
  if (!obj.types.includes("node"))
    obj.types.push("node");
  return obj;
}
async function configureTSConfig() {
  try {
    console.log("Configuring TSConfig...");
    const fpath = getFullPath("tsconfig.json");
    const fileContentOriginal = await getExistingJson(fpath);
    const fileContentUpdated = constructUpdatedTsconfig(fileContentOriginal);
    writeFileSync(fpath, JSON.stringify(fileContentUpdated, null, 4));
    return true;
  } catch (_) {
    console.error(_);
    return false;
  }
}
function constructUpdatedPackage(obj) {
  const coreInclude = {
    name: getMainAppName(),
    type: "module"
  };
  const scriptsInclude = {
    build: "npm run build:csr && npm run build:ssr",
    "build:csr": "vite build",
    "build:ssr": "vite build --ssr",
    conf: "dxsvelte"
  };
  const devDependenciesInclude = {
    "@types/node": "^18.14.6",
    dxsvelte: "0.2.0-alpha.13",
    esbuild: "0.18.7",
    figlet: "^1.6.0",
    inquirer: "^9.2.7",
    "js-base64": "^3.7.5",
    svelte: "^3.59.2",
    vite: "^4.3.9"
  };
  const dependenciesInclude = {};
  obj = { ...obj, ...coreInclude };
  if (!isObj(obj.scripts))
    obj.scripts = {};
  obj.scripts = { ...obj.scripts, ...scriptsInclude };
  if (!isObj(obj.devDependencies))
    obj.devDependencies = {};
  obj.devDependencies = { ...obj.devDependencies, ...devDependenciesInclude };
  if (!isObj(obj.dependencies))
    obj.dependencies = {};
  obj.dependencies = { ...obj.dependencies, ...dependenciesInclude };
  return obj;
}
async function configurePackage() {
  try {
    console.log("Configuring Package...");
    const fpath = getFullPath("package.json");
    const fileContentOriginal = await getExistingJson(fpath);
    const fileContentUpdated = constructUpdatedPackage(fileContentOriginal);
    writeFileSync(fpath, JSON.stringify(fileContentUpdated, null, 4));
    return true;
  } catch (_) {
    return false;
  }
}
function injectFile(filePath, inject, create = false) {
  if (checkFileExists(filePath)) {
    const data = readFileSync2(filePath, "utf8");
    if (!data.includes(inject)) {
      appendFileSync(filePath, `
${inject}`);
    }
  } else {
    if (create) {
      appendFileSync(filePath, inject);
    } else {
      console.error(`Could not install config to: ${basename(filePath)}.`);
    }
  }
}
async function installPythonScript() {
  try {
    console.log("Installing Python Script...");
    const envFilePath = getFullPath(".env");
    const settingFilePath = getFullPath(join2(getMainAppName(), "settings.py"));
    injectFile(envFilePath, `PYTHONPATH="node_modules/dxsvelte/dist"`, true);
    injectFile(settingFilePath, `import sys;sys.path.insert(0, 'node_modules/dxsvelte/dist')`, false);
    return true;
  } catch (_) {
    return false;
  }
}
async function configureVite() {
  try {
    console.log("Configuring Vite...");
    const fpath = getFullPath("vite.config.js");
    copyFileSync(join2(moduleDirectory, "vite.config.js"), fpath);
    return true;
  } catch (_) {
    return false;
  }
}
async function installPythonDependencies() {
  console.log("Installing Python dependencies...");
  try {
    execSync2(`${getPipCommand()} install py-mini-racer`, {
      stdio: "ignore",
      shell: process.env.SHELL
    });
    return true;
  } catch (_) {
  }
  return false;
}
async function installNodeDependencies() {
  console.log("Installing Node dependencies...");
  try {
    execSync2(`npm i`, {
      stdio: "ignore",
      shell: process.env.SHELL
    });
    return true;
  } catch (_) {
  }
  return false;
}
var operationOptions = {
  "Configure TSConfig": {
    checked: true,
    disabled: false,
    action: configureTSConfig
  },
  "Configure Package": {
    checked: true,
    disabled: false,
    action: configurePackage
  },
  "Configure Vite": {
    checked: !checkFileExists(getFullPath("vite.config.js")),
    disabled: false,
    action: configureVite
  },
  "Install Python Script": {
    checked: true,
    disabled: false,
    action: installPythonScript
  },
  "PIP Install Python V8 Dependency": {
    checked: false,
    disabled: false,
    action: installPythonDependencies
  },
  "NPM Install Node dependencies": {
    checked: false,
    disabled: false,
    action: installNodeDependencies
  }
};
var operationOptionsArr = Object.keys(operationOptions).map((name) => ({
  name,
  // @ts-expect-error
  checked: operationOptions[name].checked,
  // @ts-expect-error
  disabled: operationOptions[name].disabled
}));
async function main() {
  console.log(
    figlet.textSync("DxSvelte", {
      font: "Slant",
      horizontalLayout: "default",
      verticalLayout: "default",
      width: 80,
      whitespaceBreak: true
    })
  );
  const whitespaceLines = Math.max(0, (process.stdout.rows || 0) - 9 - 7);
  console.log("\n".repeat(whitespaceLines));
  const menu = await inquirer.prompt([
    {
      type: "checkbox",
      message: "Select operations. CTRL+C to cancel.\n",
      name: "operations",
      choices: [new inquirer.Separator(), ...operationOptionsArr]
    }
  ]);
  const confirmation = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Are you sure?"
    }
  ]);
  if (!confirmation.confirm) {
    main();
  } else {
    await Promise.all(
      menu.operations.map((operation) => {
        if (operationOptions.hasOwnProperty(operation)) {
          return operationOptions[operation].action();
        }
      })
    );
  }
}
function checkIsDjangoProject() {
  try {
    const result = statSync(join2(maindir, "manage.py"));
    if (result)
      return true;
    return false;
  } catch (_) {
    return false;
  }
}
if (debug || checkIsDjangoProject()) {
  main();
} else {
  const message = "DxSvelte Configurator must be run from the working directory of a Django project.";
  const formattedMessage = source_default.red(message);
  console.error(formattedMessage);
}
//# sourceMappingURL=configurator.js.map
