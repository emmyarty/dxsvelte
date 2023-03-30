<script>
  import { currentPathStore, ssrHydrate } from "{{router}}";
  {{layoutImportStatement}};
  {{svelteComponentImports}};
  export let currentRoute;
  export let ssrData = {};
  ssrHydrate(currentRoute, ssrData)
  currentPathStore.set(currentRoute);
  currentPathStore.subscribe((value) => {
    if (currentRoute !== value) {
      currentRoute = value;
    }
  });
</script>

<!-- svelte-ignore missing-declaration -->
<Layout>
  {{svelteComponentsIfs}}
</Layout>
