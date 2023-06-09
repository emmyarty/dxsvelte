<script>
  import { activeViewStore, ssrHydrate, satisfiedStorePath } from "{{router}}";
  import { writable } from "svelte/store";
  {{layoutImportStatement}};
  {{svelteComponentImports}};
  // {{svelteComponentMap}}
  export let ssrData = {};
  export let currentView;
  export let currentHref = currentView;
  let trigger = [null]

  ssrHydrate(currentView, ssrData);
  activeViewStore.set({route: currentView, href: currentHref});
  activeViewStore.subscribe((value) => {
    // if (typeof window !== "undefined") {
    //   console.log('Root component updating to: ', value)
    // }
    const reload = (currentHref !== value.href)
    currentView = value.route;
    currentHref = value.href;
    if (reload) { trigger = [null] }
  });
</script>

<!-- svelte-ignore missing-declaration -->
<Layout>
  {{svelteComponentsIfs}}
</Layout>
