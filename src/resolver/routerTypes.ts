export interface Pattern {
  type: "pattern";
  name: string | null;
  pattern: string | any;
  lookup_str?: string | null;
  callback?: string | null;
}

export interface Resolver {
  type: "resolver";
  prefix: string;
  app_name?: string | null;
  namespace?: string | null;
  url_patterns?: Pattern[];
  app_path?: string | null;
}

export interface Route {
  app: string;
  path: string;
  view: string | null;
  component: string | null;
  filename: string | null;
}

export interface Router {
  path: string;
  name: string | null;
}

export interface RouteObject {}