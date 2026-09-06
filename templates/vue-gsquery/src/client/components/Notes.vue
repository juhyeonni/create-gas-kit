<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { call } from '../api'
import Button from './ui/Button.vue'
import type { Note } from '../../shared/api'

const notes = ref<Note[]>([])
const text = ref('')
const error = ref<string>()

function showError(err: unknown) {
  error.value = err instanceof Error ? err.message : String(err)
}

function load() {
  call('listNotes')
    .then((value) => (notes.value = value))
    .catch(showError)
}

onMounted(load)

async function addNote() {
  try {
    await call('addNote', text.value)
    text.value = ''
    load()
  } catch (err) {
    showError(err)
  }
}
</script>

<template>
  <div class="counter">
    <h2>Notes</h2>
    <input class="input" type="text" placeholder="New note" v-model="text" />
    <Button @click="addNote">Add</Button>
    <ul>
      <li v-for="note in notes" :key="note.id">
        {{ note.text }} — {{ new Date(note.createdAt).toLocaleString() }}
      </li>
    </ul>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
