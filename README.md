![DxSvelteLogo](https://github.com/emmyarty/dxsvelte/raw/main/meta/logo-dxs-square-200.png)
# Django x Svelte: Alpha
[![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com/emmyarty/dxsvelte) [![NPM](https://img.shields.io/badge/NPM-%23000000.svg?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/dxsvelte)

[![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://opensource.org/licenses/MIT/)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](#)
[![Maintainer](https://img.shields.io/badge/maintainer-emmyarty-blue)](#)
[![Svelte](https://img.shields.io/badge/-Svelte-ff324f.svg)](#)
[![Python](https://img.shields.io/badge/-Python-dd743f.svg)](#)
[![TypeScript](https://img.shields.io/badge/-TypeScript-1f82df.svg)](#)

>**Warning**:
>This project is in early Alpha and key features are still under active development, including the passing of server side props.

DxSvelte is a powerful integration package that enables you to use Svelte as a front-end framework for Django web applications. With DxSvelte, you can easily build single-page applications (SPAs) that leverage the full power of both Django and Svelte, without having to worry about REST endpoints using DRF.

## Features
- **Seamless Integration:** DxSvelte integrates tightly with Django's route resolvers, allowing you to easily build SPAs with Svelte without manually connecting the dots through DRF (though you don't lose that functionality, should you need it). The whole philosophy here is that SPA functionality can and should be a 'first class citizen' in Django.
- **Automatic SPA Generation:** You don't have to manually configure REST endpoints or manage complex API interactions. Instead, DxSvelte automatically generates the SPA for you, based on the routes defined in your Django app.
- **Efficient Rendering:** DxSvelte uses Svelte's efficient rendering engine to deliver fast and responsive user experiences, without sacrificing the power and flexibility of Django. But not only that, DxSvelte also takes care of SSR (Server Side Rendering), so that the first page-load is already rendered when it arrives in the browser.
- **Fast Compilation:** DxSvelte uses ESBuild (a powerful JS compiler written in Rust) under the hood to give you the best possible compile times.
- **Incremental Adoption:** The default behaviour when it comes to navigation makes it easy to adopt the SPA incrementally. If you have an existing project you don't want to rewrite or only want for a specific portion of the site to be an SPA, then just keep going as you are; the SPA will honour any **\<a href=..\/>** tags which lead away from the SPA by checking itself against the automatically generated routing table.


------------------------------

## Getting Started
To get started with DxSvelte, initialise your Django project so it's ready to start building your SPA:

```sh
npx dxsvelte
npm i
```
You should now have a directory tree resembling the following:

```
my_project_name
├── manage.py
├── dxsvelte.py
├── package.json
├── tsconfig.json
├── my_project_name
│   └── ...
├── static
│   ├── index.html
│   ├── ...
├── ...
```
At this point, you can start building out your individual Django apps. To 'tag' them so that they are rolled up into the SPA, you need to assign names to your paths and prefix them with '$', like so:
```python
# Example app called 'home_page'
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='$index'),
    path('about', views.about, name='$about'),
]
```

Then, within the corresponding views:
```python
from dxsvelte import route, render

def index(req):
    # Your normal view logic goes here
    return render(req, data?)

def about(req):
    return render(req)
```

Finally, build out your view components, and optionally within your main app folder create your own **layout.svelte** file:
```
my_project_name
├── manage.py
├── dxsvelte.py
├── package.json
├── tsconfig.json
├── home_page
│   ├── ...
│   └── views
│       ├── index.svelte
│       └── about.svelte
├── my_project_name
│   └── layout.svelte
└── ...
```
Finally, build it.
```sh
npm run compile
```
That's it! Now you can start building your Svelte-powered hybrid SSR SPA, all while using Django as your back-end.

## Contributing
We welcome contributions to DxSvelte! If you'd like to contribute, please open an issue or pull request on our [GitHub repository](https://github.com/).

## License
DxSvelte is released under the [MIT License](https://opensource.org/licenses/MIT/).