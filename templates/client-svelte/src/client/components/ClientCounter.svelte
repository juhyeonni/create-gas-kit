<script lang="ts">
  import Button from './ui/Button.svelte'

  let count = $state(0)
</script>

<div class="counter">
  <h2>Client counter</h2>
  <div class="counter-value">{count}</div>
  <Button onclick={() => count++}>+1</Button>
  <Button onclick={() => (count = 0)}>Reset</Button>
</div>
