<script>
  import { activeViewStore, ssrHydrate, satisfiedStorePath } from '@dxsvelte:router'
  import { viewComponents } from '@dxsvelte:views'
  import Layout from '@dxsvelte:layout'

  export let ssrData = {}
  export let currentView
  export let currentHref = currentView
  let trigger = [null]

  ssrHydrate(currentView, ssrData)
  activeViewStore.set({ route: currentView, href: currentHref })
  activeViewStore.subscribe((value) => {
    const reload = currentHref !== value.href
    currentView = value.route
    currentHref = value.href
    if (reload) {
      trigger = [null]
    }
  })
</script>

<!-- svelte-ignore missing-declaration -->
<Layout>
  {#each trigger as _}
    {#each viewComponents as view}
      {#if satisfiedStorePath(currentView) === view.path}
        <svelte:component this={view.component} />
      {/if}
    {/each}
  {/each}
</Layout>
