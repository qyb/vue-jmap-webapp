<script setup lang="ts">
import { store } from '@/utils/store'
import { MINI_STATE } from '@/utils/screen'
const props = defineProps<{
  modal: boolean
  close: ()=>void
}>()
</script>
<template>
  <div v-if="modal"
    style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,.5); z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;">
    <div style="background-color: #fefefe; display: flex; flex-direction: column;"
      :class="store.widthState == MINI_STATE?'mini-modal-content':'normal-modal-content'">
      <div class="appbar">
        <span style="color: #d2dbe0;">CenterIt</span>
        <span style="vertical-align: middle;"><slot name="title">title</slot></span>
        <button @click="close()" style="float: right; margin-right: 6px;">close</button>
      </div>
      <slot name="content"></slot>
      <div style="display: flex; justify-content: center; align-items: center;
        height: 32px; border-top: 1px solid #4A6572; ">
        <slot name="bottom"></slot>
      </div>
    </div>
  </div>
</template>
