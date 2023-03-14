<script>
  // import { currentPathStore, goto } from '@harika/router'
  // import Layout from '../{{__main}}/layout.svelte'
  import { currentPathStore } from "{{router}}";
  {{layoutImportStatement}};
  {{svelteComponentImports}};
  export let currentRoute;
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
