import type { Config, Pattern, Resolver, Route, RouteObject } from './types'
import { execSync, spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

function posixSlash(str: string | null) {
  if (!str) return str
  return str.replace(/\\/g, '/')
}

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const dxsvelteImportString = `import sys;sys.path.insert(0, '${posixSlash(moduleDirectory)}')`

const routerResolverPy = String.raw`#!/usr/bin/python3
import os
import sys
${dxsvelteImportString}
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
sys.stdout.flush()`

function extract(str: string) {
  const delimiter = '===DXSVELTE_DELIMITER==='
  const regex = new RegExp(`${delimiter}(.*?)${delimiter}`)
  const match = str.match(regex)
  if (typeof match === 'undefined' || match === null) {
    throw new Error ('Router resolver Python response mangled.')
  }
  return match[1]
}

function runPythonResolverScript(config: Config): string {
  const command = config.python ?? 'python3'
  const { stdout, stderr, status } = spawnSync(process.env.SHELL!, ['-c', command], { input: routerResolverPy, encoding: 'utf-8' })
  if (status === 0) {
    try {
      const encodedJsonString = extract(stdout)
      const encodedJsonBuffer = Buffer.from(encodedJsonString, 'base64')
      const decodedJsonBuffer = encodedJsonBuffer.toString('utf-8')
      return decodedJsonBuffer
    } catch (err) {
      console.error(err)
      throw new Error('Django resolver failed to produce a valid object.')
    }
  } else {
    throw new Error(stderr.trim())
  }
}

function getRouterResolver(config: Config) {
  try {
    const routerJsonString = runPythonResolverScript(config)
    const routerJsonObj = JSON.parse(routerJsonString)
    return routerJsonObj as Resolver[]
  } catch (err) {
    console.error(err)
    throw new Error('Could Not Load Django Router Object')
  }
}

function formatSvelteComponentFilepath(parent: string, str: string, config: any) {
  if (str.length < 2) {
    throw new Error(`${str} is not a valid component file.`)
  }
  const fname = `${str.slice(1)}.svelte`
  return posixSlash(join(config.baseDirectory, parent, config.views ?? 'views', fname))
}

function formatSvelteComponentTagName(str: string) {
  if (str.length < 2) return str
  return str.charAt(1).toUpperCase() + str.slice(2).replace('$', '')
}

function capitaliseTagName(str: string) {
  if (str.length === 0) return str
  let ret = str.charAt(0).toUpperCase()
  if (str.length === 1) return ret
  return ret + str.slice(1)
}

function constructPathFromSegments(...segments: string[]) {
  const path = segments.join('/')
  const cleanPath = path.replace(/\/\/+/g, '/')
  const trimmedPath = cleanPath.replace(/^\/|\/$/g, '')
  return '/' + trimmedPath
}

function translateDjangoResolver(input: Resolver[], config: any) {
  const { mainApp, baseDirectory } = config
  if (typeof mainApp !== 'string' || typeof baseDirectory !== 'string') {
    throw new Error('Malformed configuration in DxSvelte config.')
  }
  const router: Route[] = []
  const traverse = (parent: Resolver | null, data: Pattern | Resolver) => {
    if (data.type === 'resolver') {
      if (!Array.isArray(data.url_patterns)) return null
      data.url_patterns.map((item) => {
        traverse({ ...data } as Resolver, item)
      })
    }
    // We need to rework this massively. It's not enough to assume that every resolver marked to be included will be the child of an included view.
    if (data.type === 'pattern') {
      if (!parent || !parent.app_path) {
        parent = {
          app_path: mainApp,
          type: 'resolver',
          prefix: ''
        }
      }
      if (!parent || !parent.app_path || typeof data.pattern !== 'string' || !data.name || data.name[0] !== '$') return null
      const route = {
        app: parent.app_path,
        path: parent.prefix ? constructPathFromSegments(parent.prefix, data.pattern) : constructPathFromSegments(data.pattern),
        view: data.name ?? null,
        static: data.static_view,
        component: data.name ? capitaliseTagName(parent.app_path) + formatSvelteComponentTagName(data.name) : null,
        filename: data.name && parent.app_path ? formatSvelteComponentFilepath(parent.app_path, data.name, config) : null
      }
      router.push(route)
    }
  }
  if (!Array.isArray(input)) return router
  input.map((item) => traverse(null, item))
  return router
}

export function getDjangoRouter(config: Config) {
  const resolvedRouter = getRouterResolver(config)
  const translatedRouter = translateDjangoResolver(resolvedRouter, config ?? null)
  return translatedRouter
}