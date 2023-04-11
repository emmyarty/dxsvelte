#!/usr/bin/python3
import functools
import inspect
import os
import sys
import django
from django.conf import settings
from django.urls import get_resolver, URLPattern, URLResolver
from django.urls.resolvers import RoutePattern
import json
import re

sys.path.append(os.getcwd())

with open('manage.py', 'r') as f:
    manage_py_content = f.read()

pattern = r"os\.environ\.setdefault\(['\"]DJANGO_SETTINGS_MODULE['\"]\s*,\s*(['\"].+['\"])"
match = re.search(pattern, manage_py_content)
project_settings = match.group(1).strip('"').strip("'")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', project_settings)
django.setup()

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

#+OPERATIONAL+#
with open('./{{cache}}/routerResolver.json', 'w') as file:
    file.write(output)
#+OPERATIONAL+#

#+DEBUG+#
print(output)
#+DEBUG+#