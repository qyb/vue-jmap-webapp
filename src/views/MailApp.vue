<script setup lang="ts">
import { ref } from 'vue'

const width = ref(0)
const height = ref(0)

function onResize (ele: HTMLElement): void {
  width.value = ele.offsetWidth,
  height.value = ele.offsetHeight
}

defineProps<{
  arg: string
}>()

</script>

<template>
  <div v-layout:[arg]="onResize" class="appcontainer">
    foobar, {{ width }}, {{ height }}
  </div>
</template>

<style>
.appcontainer {
  height: 100%
}
</style>
