<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { $globalLayout } from '@/utils/global'

// resize 事件处理有性能损失，需要想办法做一个限流阀 resizeThrottler
// https://developer.mozilla.org/zh-CN/docs/Web/API/Window/resize_event
let resizeTimeout: number | null | NodeJS.Timeout = null

function onResize (): void {
  for (let key in $globalLayout) {
    let ele = $globalLayout[key].ele
    $globalLayout[key].handler(ele)
  }
}


function resizeThrottler (): void {
  // ignore resize events as long as an actualResizeHandler execution is in the queue
  if ( !resizeTimeout ) {
    resizeTimeout = setTimeout(() => {
      resizeTimeout = null
      // The actualResizeHandler will execute at a rate of 15fps
      onResize()
    }, 66)
  }
}

onMounted(() => {
  onResize()


  window.addEventListener('resize', resizeThrottler, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeThrottler)
})


</script>

<template>
  <router-view/>
</template>

<style>
html, body {
  height: 100%;
  margin: 0;
}

ul {
  list-style-type: none;
  text-align: left;
  margin-right: 10px;
  margin-left: 10px;
  padding-inline-start: 0px;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
  display: flex;
  flex-direction: column;
}
a {
  text-decoration: underline;
}
</style>
