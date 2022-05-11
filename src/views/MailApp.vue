<script setup lang="ts">
import { ref } from 'vue'
import { onMounted } from 'vue'
import { getClientHeight, getClientWidth } from '@/layout';

const width = ref(0)
const height = ref(0)
const folderClass = ref('folder-1')
const msglistClass = ref('msglist-1')

function onResize (ele: HTMLElement): void {
  width.value = ele.offsetWidth,
  height.value = ele.offsetHeight
}

onMounted(() => {
  const h = getClientHeight()
  const w = getClientWidth()
  console.log(h, w)
})

defineProps<{
  arg: string
}>()

</script>

<template>
  <div v-layout:[arg]="onResize" class="appcontainer">
    <div class="menu">
      foobar, {{ width }}, {{ height }}
    </div>
    <div class="main">
      <div :class="folderClass" class="folder">
      </div>
      <div :class="msglistClass" class="msglist">

      </div>
      <div class="msgcontent"></div>
    </div>
  </div>
</template>

<style>
.appcontainer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main {
  flex-grow: 1;
  display: flex;
  flex-direction: row;
}

.folder {
  background-color: aquamarine;
}

.folder-1 {
  width: 198px;
  max-width: 198px;
}

.folder-2 {
  width: 214px;
  max-width: 236px;
}

.msglist {
  background-color: beige;
}

.msglist-1 {
  width: 350px;
  max-width: 350px;
}

.msglist-2 {
  width: 376px;
  max-width: 380px;
}

.msgcontent {
  flex-grow: 1;
}
</style>
