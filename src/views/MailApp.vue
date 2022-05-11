<script setup lang="ts">
import { ref } from 'vue'
import { onMounted } from 'vue'
import { getClientHeight, getClientWidth } from '@/layout';

const width = ref(0)
const height = ref(0)

const MINI_STATE = 0
const COMPACT_STATE = 1
const NORMAL_STATE = 2
const FULL_STATE = 3

const MIN_FULL = 1000
const MIN_NORMAL = 920
const MIN_COMPACT = 768

/*
  <768, miniview, only msgcontent
  >=768, compactview, no folder
  >=920, normalview, compact folder/msglist
  >=1000, fullview
 */
// default define as compact mode
const layoutState = {
  widthState: NORMAL_STATE
}
const folderClass = ref('folder-normal')
const msglistClass = ref('msglist-normal')

function setStateFull () {
  folderClass.value = 'folder-full'
  msglistClass.value = 'msglist-full'
  layoutState.widthState = FULL_STATE
}
function setStateNormal () {
  folderClass.value = 'folder-normal'
  msglistClass.value = 'msglist-normal'
  layoutState.widthState = NORMAL_STATE
}
function setStateCompact () {
  layoutState.widthState = COMPACT_STATE
}
function setStateMini () {
  layoutState.widthState = MINI_STATE
}

function onResize (ele: HTMLElement): void {
  width.value = ele.offsetWidth,
  height.value = ele.offsetHeight

  if (width.value >= MIN_FULL) {
    if (layoutState.widthState != FULL_STATE) {
      setStateFull()
    }
  } else if (width.value >= MIN_NORMAL) {
    if (layoutState.widthState != NORMAL_STATE) {
      setStateNormal()
    }
  } else if (width.value >= MIN_COMPACT) {
    if (layoutState.widthState != COMPACT_STATE) {
      setStateCompact()
    }
  } else {
    if (layoutState.widthState != MINI_STATE) {
      setStateMini()
    }
  }
}

onMounted(() => {
  const h = getClientHeight()
  const w = getClientWidth()
  console.log(h, w)

  if (w >= MIN_FULL) {
    setStateFull()
  } else if (w >= MIN_NORMAL) {
    setStateNormal()
  } else if (w >= MIN_COMPACT) {
    setStateCompact()
  } else {
    setStateMini()
  }
})

defineProps<{
  arg: string
}>()

</script>

<template>
  <div v-layout:[arg]="onResize" class="appcontainer">
    <div class="menu">
      Toolbar, {{ width }}, {{ height }}
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

.folder-normal {
  width: 198px;
  max-width: 198px;
}

.folder-full {
  width: 214px;
  max-width: 236px;
}

.msglist {
  background-color: beige;
}

.msglist-normal {
  width: 350px;
  max-width: 350px;
}

.msglist-full {
  width: 376px;
  max-width: 380px;
}

.msgcontent {
  flex-grow: 1;
}
</style>
