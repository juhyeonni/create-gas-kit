<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { call } from '../api'
import Button from './ui/Button.vue'

const count = ref(0)
const error = ref<string>()

function showError(err: unknown) {
  error.value = err instanceof Error ? err.message : String(err)
}

onMounted(() => {
  call('getCount')
    .then((value) => (count.value = value))
    .catch(showError)
})

async function run(action: 'increment' | 'reset') {
  try {
    count.value = await call(action)
  } catch (err) {
    showError(err)
  }
}
</script>

<template>
  <div class="counter">
    <h2>Server counter</h2>
    <div class="counter-value">{{ count }}</div>
    <Button @click="run('increment')">+1</Button>
    <Button @click="run('reset')">Reset</Button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
