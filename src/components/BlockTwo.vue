<script setup lang="ts">

import { ref } from 'vue'

const width = ref(0)
const height = ref(0)

function foobar (ele: HTMLElement): void {
  width.value = ele.offsetWidth,
  height.value = ele.offsetHeight
}

defineProps<{
  arg: string
}>()

</script>

<template>
  <div v-layout:[arg]="foobar" style="flex-grow: 1; height: 100%">
    {{ arg }}, {{ width }}, {{ height }}
  </div>
</template>
