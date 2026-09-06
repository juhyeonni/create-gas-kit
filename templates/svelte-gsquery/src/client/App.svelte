<script lang="ts">
  import { kit } from './kit'
  import ClientCounter from './components/ClientCounter.svelte'
  import ServerCounter from './components/ServerCounter.svelte'
  import Notes from './components/Notes.svelte'
</script>

<div class="app">
  <header class="header">
    <h1>{kit.name}</h1>
    <p class="specs">create-gas-kit · {kit.specs.join(' · ')}</p>
  </header>
  <ClientCounter />
  <ServerCounter />
  <Notes />
</div>
