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
>This project is in early Alpha and key features are still under active development. Please note that, for the time being, you will need to delete the automatically generated *tsconfig.json* and *dxsvelte.py* files from your project's root directory. The current behaviour is to not overwrite these files.

DxSvelte is a powerful integration package that enables you to use Svelte as a front-end framework for Django web applications. With DxSvelte, you can easily build single-page applications (SPAs) that leverage the full power of both Django and Svelte, without having to worry about REST endpoints using DRF.

## Patch 0.0.21
- **Reverted to Py Mini Racer:** Preparing to migrate the Python dependencies to its own package down the road; for now, you will need to manually add py_mini_racer to your Python requirements and ensure it's installed. SSR without NodeJS is back. You'll still need NodeJS during development, of course.
- **Omitted HTTP Method:** This was overdue, GET is GET whether via CSR or SSR.
- *Now in a good place to start implementing CSRF and Django forms.*

## Patch 0.0.20
- **Router Improvements:** Addressed a long-standing hole in the resolver which made it impossible to have views directly on the root path; index pages no longer need workarounds. The front-end router is now more feature complete as well, with backwards and forwards navigation through history in place.
- **Introduced @common:** A global utilities module can now be imported anywhere in your SPA, which will expose useful objects over time. At the moment, it contains a ViewState store which returns a 'pathSatisfies' function property - useful for evaluating your links against the current page to apply your 'active' CSS classes in nav bars etc.
- **Renamed @dxs to @page:** With the introduction of @common, it seems sensible to rename @dxs to something a bit more meaningful.
- **Fixed newline preservation:** Dict -> JSON SSP payloads were losing their newlines; this has been addressed. There is still an outstanding issue with special characters that will be dealt with imminently.
- **Svelte Version Update:** Updated Svelte dependency to 3.58.0.

## Milestone Release 0.0.18
- **Route Parameters:** You can now use your **\<str:something\>** values in DxSvelte routes - they work. Use them to customise your server-side props, and build out your individual views as before.
- **CSS Generation:** CSS now builds successfully where included in the style tags, but be warned that PostCSS will still not work. For now the mixture of component styling & pre-built stylesheets has pushed the outstanding down the priority queue for now, but it is still on the list.
- **Django Dict -> Svelte Data Passing:** SSR improved and cleaned up, more refactoring.

## Features
- **Seamless Integration:** DxSvelte integrates tightly with Django's route resolvers, allowing you to easily build SPAs with Svelte without manually connecting the dots through DRF (though you don't lose that functionality, should you need it). The whole philosophy here is that SPA functionality can and should be a 'first class citizen' in Django.
- **Automatic SPA Generation:** You don't have to manually configure REST endpoints or manage complex API interactions. Instead, DxSvelte automatically generates the SPA for you, based on the routes defined in your Django app.
- **Efficient Rendering:** DxSvelte uses Svelte's efficient rendering engine to deliver fast and responsive user experiences, without sacrificing the power and flexibility of Django. But not only that, DxSvelte also takes care of SSR (Server Side Rendering), so that the first page-load is already rendered when it arrives in the browser.
- **Fast Compilation:** DxSvelte uses ESBuild (a powerful JS compiler written in Rust) under the hood to give you the best possible compile times.
- **Incremental Adoption:** The default behaviour when it comes to navigation makes it easy to adopt the SPA incrementally. If you have an existing project you don't want to rewrite or only want for a specific portion of the site to be an SPA, then just keep going as you are; the SPA will honour any **\<a href=..\/>** tags which lead away from the SPA by checking itself against the automatically generated routing table.

## To-Do List & Known Bugs
- **CSRF:** For the time being, you'll need to use the exemption decorator. This will be addressed in a future preview release.
- **Node Dependency:** Down the road, the aim is to revert back to the embedded V8 runtime. For now, the target platform will need to have NodeJS installed, as well as Python.
- **VENV Usage:** Configuration options for virtual environments aren't currently supported. Please ensure that 'python' is bound to a version which works with your version of Django so the router resolution during build can take place. This only affects the build step and will not affect how you run your server.
- **Page Title Updates:** Will be added in the near future.
- **CSS Generation:** PostCSS support for Tailwind etc.
- **Type Generation (Autocomplete):** Decision TBC

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
└── ...
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
from dxsvelte import render

def index(req):
    # Your normal view logic goes here
    return render(req, data?)

def about(req):
    return render(req)
```

Build out your view components, and optionally within your main app folder create your own **layout.svelte** file:
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
If you do write your own layout.svelte component (recommended), ensure that you leave the '\<slot/\>' element in there somewhere - that's what gets replaced with your page contents. For now, more advanced layouts are not supported.
```html
<h1>Your Website Name.</h1>
<slot/>
```

Finally, build it.
```sh
npm run compile
```
That's it! Now you can start building your Svelte-powered hybrid SSR SPA, all while using Django as your back-end.


------------------------------

## Passing Parameters & Server-Side Props

You can now pass your server-side props as a Dict from your Django view directly to Svelte, while still taking full advantage of SSR. Usage is simple, but be sure to validate your objects on the front-end before accessing them. The data argument is optional and can be omitted if you have no server-side properties to pass.

```py
urlpatterns = [
    path('', views.index, name='$index'),
    path('about/<str:company>/', views.about, name='$about'),
]
```

```py
def about(req, company):
    data = {
        "aboutUsText": "Lorem ipsum dolor sit amet, consectetur adip...",
        "company": "You are viewing the page for " + company + "!"
    }
    return render(req, data)
```

Meanwhile, in your **about.svelte** component over in the ./views directory:
```jsx
<script>
    // The import statement from @page below retrieves the server-side props.
    // The line beneath that registers 'data' as a reactive variable from it.
    import { ServerSideProps } from "@page";
    $: data = $ServerSideProps
    let incrementedValue = 0
    const increment = () => {
		incrementedValue ++
	}
</script>

{#if data?.company && data.aboutUsText}
    <h1>About {data.company}.</h1>
	{data.aboutUsText}
{/if}

<button on:click={increment}>Number Goes Up</button>
```

That's it! For now...

------------------------------


## Contributing
We welcome contributions to DxSvelte! If you'd like to contribute, please open an issue or pull request on our [GitHub repository](https://github.com/emmyarty/dxsvelte).

## License
DxSvelte is released under the [MIT License](https://opensource.org/licenses/MIT/).