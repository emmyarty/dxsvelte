import { join } from "path";
import { Pattern, Resolver, Route } from "./routerTypes";
import { __basedir } from "../settings/config";

function posixSlash(str: string | null) {
  if (!str) return str;
  return str.replace(/\\/g, "/");
}

function formatSvelteComponentFilepath(parent: string, str: string) {
  if (str.length < 2) {
    throw new Error(`${str} is not a valid component file.`);
  }
  const fname = `${str.slice(1)}.svelte`;
  return posixSlash(join(__basedir, parent, "views", fname));
}

function formatSvelteComponentTagName(str: string) {
  if (str.length < 2) return str;
  return str.charAt(1).toUpperCase() + str.slice(2).replace("$", "");
}

function capitaliseTagName(str: string) {
  if (str.length === 0) return str;
  let ret = str.charAt(0).toUpperCase();
  if (str.length === 1) return ret;
  return ret + str.slice(1);
}

function constructPathFromSegments(...segments: string[]) {
  const path = segments.join("/");
  const cleanPath = path.replace(/\/\/+/g, "/");
  const trimmedPath = cleanPath.replace(/^\/|\/$/g, "");
  return "/" + trimmedPath;
}

export function translateDjangoResolver(input: Resolver[]) {
  const router: Route[] = [];
  const traverse = (parent: Resolver | null, data: Pattern | Resolver) => {
    if (data.type === "resolver") {
      if (!Array.isArray(data.url_patterns)) return null;
      data.url_patterns.map((item) => {
        traverse({ ...data } as Resolver, item);
      });
    }
    if (data.type === "pattern") {
      if (
        !parent ||
        !parent.app_path ||
        !parent.prefix ||
        typeof data.pattern !== "string" ||
        !data.name ||
        data.name[0] !== "$"
      )
        return null;
      const route = {
        app: parent.app_path,
        path: constructPathFromSegments(parent.prefix, data.pattern),
        view: data.name ?? null,
        component: data.name
          ? capitaliseTagName(parent.app_path) +
            formatSvelteComponentTagName(data.name)
          : null,
        filename:
          data.name && parent.app_path
            ? formatSvelteComponentFilepath(parent.app_path, data.name)
            : null,
      };
      router.push(route);
    }
  };
  if (!Array.isArray(input)) return router;
  input.map((item) => traverse(null, item));
  return router;
}