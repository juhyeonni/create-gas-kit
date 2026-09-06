<script setup lang="ts">
import { kit } from './kit'
import ClientCounter from './components/ClientCounter.vue'
import ServerCounter from './components/ServerCounter.vue'
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>{{ kit.name }}</h1>
      <p class="specs">create-gas-kit · {{ kit.specs.join(' · ') }}</p>
    </header>
    <ClientCounter />
    <ServerCounter />
  </div>
</template>
