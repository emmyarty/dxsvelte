![DxSvelteLogo](https://github.com/emmyarty/dxsvelte/raw/main/meta/logo-dxs-square-200.png)
# Django x Svelte: Alpha

[![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com/emmyarty/dxsvelte) [![NPM](https://img.shields.io/badge/NPM-%23000000.svg?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/dxsvelte)

[![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://opensource.org/licenses/MIT/)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](#)
[![Maintainer](https://img.shields.io/badge/maintainer-emmyarty-blue)](#)
[![Svelte](https://img.shields.io/badge/-Svelte-ff324f.svg)](#)
[![Python](https://img.shields.io/badge/-Python-dd743f.svg)](#)
[![TypeScript](https://img.shields.io/badge/-TypeScript-1f82df.svg)](#)

## 📔 Documentation
The new documentation is now available to read. And it was built with DxSvelte!

[![Documentation](https://img.shields.io/badge/Read%20It-Here-orange?&style=for-the-badge)](https://dxsvelte.com/)

## 💌 Introduction
>**Warning**:
>This project is in early Alpha and key features are still under active development.

DxSvelte is a powerful integration package that brings Svelte to your Django web applications with a simplified workflow, closer to how you would normally Render views. Enjoy the full benefit of SSR in your next single-page application (SPA).

## 🎉 Milestone Release 0.1.0
With enough core features now in place, the work immediately on the horizon is going to be a slight refactoring in order to accommodate future changes, bugfixing as and when they're found, and some proper documentation - hosted on a DxSvelte app, of course. Recent feature upgrades:
- **Static Views:** You can now decorate your view handlers with **@static_view** if you know the view will never receive any server-side props. This will mean that particular view will work offline once the app is already loaded, reducing the burden on your server.
- **Forms Support:** By importing and using the **FormSetup** constructor function from **@common** in your Svelte components, you can turn your traditional form post into a reactive one with hardly any boilerplate, and pass in a callback to handle the response.
- **CSRF Tokens:** This is taken care of by default if you're using FormSetup, but if you're constructing your own POST requests and just need to obtain a headers object with the key value pair to either use or spread into a different header, import and use **getCsrfTokenHeader()** from **@common**. The token itself is passed to the SPA during SSR.
- **Improved Updater:** No longer any need to manually delete, reinstall, and reupdate your package.json and tsconfig.json files. Rather than being regenerated wholesale, they are now just parsed, patched, and saved. Your patience with this has been appreciated, but it's over now.
- **Compiling Triggers Restarts:** Recompiling your SPA while Django is running will now automatically trigger a restart of your dev server.

##  Patch Release 0.1.1
- **Updated README:** Added a link to the new documentation, built with DxSvelte!
- **Bug Fix:** Addressed an issue where history.pushState() would run and fail on external links, set the no-cache headers on JSON payloads.

## Features
- **Seamless Integration:** DxSvelte integrates tightly with Django's route resolvers, allowing you to easily build SPAs with Svelte without manually connecting the dots through DRF (though you don't lose that functionality, should you need it). The whole philosophy here is that SPA functionality can and should be a 'first class citizen' in Django.
- **Automatic SPA Generation:** You don't have to manually configure REST endpoints or manage complex API interactions. Instead, DxSvelte automatically generates the SPA for you, based on the routes defined in your Django app.
- **Easy Server-Side Props:** When rendering a view, you may pass a dictionary as the second argument and access it via the **$data** object in your Svelte template file.
- **Server Side Rendering (SSR):** DxSvelte uses Svelte's efficient rendering engine to deliver fast and responsive user experiences, without sacrificing the power and flexibility of Django. But not only that, DxSvelte also takes care of SSR (Server Side Rendering), so that the first page-load is already rendered when it arrives in the browser.
- **Fast Compilation:** DxSvelte uses ESBuild (a powerful JS compiler written in Rust) under the hood to give you the best possible compile times.
- **Incremental Adoption:** The default behaviour when it comes to navigation makes it easy to adopt the SPA incrementally. If you have an existing project you don't want to rewrite or only want for a specific portion of the site to be an SPA, then just keep going as you are; the SPA will honour any **\<a href=..\/>** tags which lead away from the SPA by checking itself against the automatically generated routing table.

## To-Do List & Known Bugs
- **404 Errors:** Will be added in the near future.
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

------------------------------


## Contributing
We welcome contributions to DxSvelte! If you'd like to contribute, please open an issue or pull request on our [GitHub repository](https://github.com/emmyarty/dxsvelte).

## License
DxSvelte is released under the [MIT License](https://opensource.org/licenses/MIT/).