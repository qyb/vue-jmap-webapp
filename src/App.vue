<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import HelloWorld from './components/HelloWorld.vue'

import { ref } from 'vue'
import { onMounted, onUnmounted } from 'vue'

// Cross-browser support as described in:
// https://stackoverflow.com/questions/1248081
function getClientWidth () {
  return Math.max(
    document.documentElement!.clientWidth,
    window.innerWidth
  )
}

function getClientHeight () {
  return Math.max(
    document.documentElement!.clientHeight,
    window.innerHeight
  )
}

const height = ref(getClientHeight())
const width = ref(getClientWidth())

function onResize () {
  height.value = getClientHeight()
  width.value = getClientWidth()
}

onMounted(() => {
  window.addEventListener('resize', onResize, { passive: true });
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

</script>

<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Hello Vue 3 + TypeScript + Vite" />
  <div>{{ width }}, {{ height }}</div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
