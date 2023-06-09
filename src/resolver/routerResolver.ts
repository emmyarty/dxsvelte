// @ts-ignore
import routerResolverRaw from "./routerResolver.$.py";
import { translateDjangoResolver } from "./routerTranslate"
import { Resolver } from "./routerTypes";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, unlinkSync, mkdirSync, rmSync } from "fs";
import path from "path";
import config from '../settings/config'
import { injectOptionsIntoString } from '../compiler/injector';
const { __cache, app_name, cache } = config;

export function getRouter() {
    console.log('Getting router...')    
    
    function stripBlock(input: string, tag: string): string {
      const regexBlock = new RegExp(
        `#\\+${tag}\\+#([\\s\\S]*?)#\\+${tag}\\+#`,
        "gm"
      );
      const regexHead = new RegExp(`#\\+([\\S]*?)\\+#`, "gm");
      input = input.replace(regexBlock, "");
      input = input.replace(regexHead, "");
      return input;
    }
        
    let routerResolver: string;
    
    routerResolver =
      process.env.NODE_ENV === "debug"
        ? stripBlock(routerResolverRaw, "OPERATIONAL")
        : stripBlock(routerResolverRaw, "DEBUG");
    
    routerResolver = injectOptionsIntoString({app_name, cache}, routerResolver);
    
    function importData() {
      const routerBuildPyFname = path.join(__cache, "tmp");
      const fname = path.join(__cache, "routerResolver.json");
      try {
        writeFileSync(routerBuildPyFname, routerResolver);
        execSync(`${config.pythonCmd} ${routerBuildPyFname}`);
        const fileUtf8 = readFileSync(fname, "utf8");
        const fileJson = JSON.parse(fileUtf8);
        return fileJson as Resolver[];
      } catch (err) {
        console.error(err);
        throw new Error("Could Not Load Django Router Object");
      }
    }
    const djangoJsonResolver = importData()
    const svelteJsonResolver = translateDjangoResolver(djangoJsonResolver)
    return svelteJsonResolver
}