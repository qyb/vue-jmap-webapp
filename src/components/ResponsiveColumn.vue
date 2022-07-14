<script setup lang="ts">
import { onMounted, ref, watch, inject, Ref } from 'vue'
import { store } from '@/utils/store'
import type {contextMenuFunc} from '@/utils/store'
import { MINI_STATE, FULL_STATE } from '@/utils/screen'
import { $globalState } from '@/utils/global'

const showLeftInRight = ref(false)
const leftInMiniUI = inject('leftInMiniUI') as Ref<boolean>

watch(
  () => leftInMiniUI.value,
  (newArg, oldArg) => {
    if (newArg) {
      // click back2Left menuIcon
      showLeftInRight.value = true
    } else {
      // readThread or other operation in leftColumn
      showLeftInRight.value = false
    }
  }
)

const contextMenu = inject('contextMenu') as contextMenuFunc

watch(
  () => store.widthState,
  (newState, oldState) => {
    if (newState == MINI_STATE) {
      // emit `contextMenu` in toolbar
      if ($globalState.focusRightColumn) {
        showLeftInRight.value = false
        contextMenu(true)
      } else {
        showLeftInRight.value = true
        contextMenu(false)
      }
    } else {
      /**
       * Next line is the key why not directly use leftInMiniUI
       * parent component won't watch widthState
       */
      showLeftInRight.value = false
    }
  }
)

onMounted(() => {
  if (store.widthState == MINI_STATE) {
    // if switchMbox from setting in MINI_STATE, show left in right
    showLeftInRight.value = true
  }
})
</script>

<template>
  <div class="two-column">
    <div v-if="store.widthState > MINI_STATE"
      :class="store.widthState == FULL_STATE ? 'full-left' : 'normal-left'"
      class="left-column"
    >
      <slot name="left"></slot>
      <div class="column-toolbar">
        <slot name="left-toolbar"></slot>
      </div>
    </div>
    <div class="right-column">
      <slot v-if="showLeftInRight" name="left"></slot>
      <slot v-else name="right"></slot>
      <div class="column-toolbar">
        <slot v-if="showLeftInRight" name="left-toolbar"></slot>
        <slot v-else name="right-toolbar"></slot>
      </div>
    </div>
  </div>
</template>

<style>
.two-column {
  flex-grow: 1;
  display: flex;
  flex-direction: row;
}

.left-column {
  position: relative; /* for position:absolute subdiv toolbar */
}

.right-column {
  flex-grow: 1;
  background-color: #fefefe;
  color: #344955;
  width: 0; /* 防止被子元素撑出横向滚动条 */
  text-align: left;
  position:relative; /* for position:absolute subdiv toolbar */
}

.column-toolbar {
  position:absolute;
  top: -32px;
  margin-top: 4px;
  height: 24px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.normal-left {
  width: 350px;
  max-width: 350px;
  background-color: grey;
  height: 100%;
}

.full-left {
  width: 376px;
  max-width: 380px;
  background-color: grey;
  height: 100%;
}
</style>
