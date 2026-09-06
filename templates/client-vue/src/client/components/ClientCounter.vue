<script setup lang="ts">
import { ref } from 'vue'
import Button from './ui/Button.vue'

const count = ref(0)
</script>

<template>
  <div class="counter">
    <h2>Client counter</h2>
    <div class="counter-value">{{ count }}</div>
    <Button @click="count++">+1</Button>
    <Button @click="count = 0">Reset</Button>
  </div>
</template>
