<script lang="ts">
  import { call } from '../api'
  import Button from './ui/Button.svelte'

  let count = $state(0)
  let error = $state<string>()

  function showError(err: unknown) {
    error = err instanceof Error ? err.message : String(err)
  }

  call('getCount')
    .then((value) => (count = value))
    .catch(showError)

  async function run(action: 'increment' | 'reset') {
    try {
      count = await call(action)
    } catch (err) {
      showError(err)
    }
  }
</script>

<div class="counter">
  <h2>Server counter</h2>
  <div class="counter-value">{count}</div>
  <Button onclick={() => run('increment')}>+1</Button>
  <Button onclick={() => run('reset')}>Reset</Button>
  {#if error}
    <p class="error">{error}</p>
  {/if}
</div>
