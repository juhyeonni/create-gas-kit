<script lang="ts">
  import { call } from '../api'
  import Button from './ui/Button.svelte'
  import type { Note } from '../../shared/api'

  let notes = $state<Note[]>([])
  let text = $state('')
  let error = $state<string>()

  function showError(err: unknown) {
    error = err instanceof Error ? err.message : String(err)
  }

  function load() {
    call('listNotes')
      .then((value) => (notes = value))
      .catch(showError)
  }

  load()

  async function addNote() {
    try {
      await call('addNote', text)
      text = ''
      load()
    } catch (err) {
      showError(err)
    }
  }
</script>

<div class="counter">
  <h2>Notes</h2>
  <input class="input" type="text" placeholder="New note" bind:value={text} />
  <Button onclick={addNote}>Add</Button>
  <ul>
    {#each notes as note (note.id)}
      <li>{note.text} — {new Date(note.createdAt).toLocaleString()}</li>
    {/each}
  </ul>
  {#if error}
    <p class="error">{error}</p>
  {/if}
</div>
