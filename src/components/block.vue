<script setup lang="ts">
import { ref } from 'vue'

const width = ref(0)
const height = ref(0)
function onResize (entries) {
  let entry = entries[0]
  width.value = entry.contentRect.width
  height.value = entry.contentRect.height
}

</script>

<template>
  <div v-resize="onResize" style="flex-grow: 1; height: 100%">{{ width }}, {{ height }}</div>
</template>
