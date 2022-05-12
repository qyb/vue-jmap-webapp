<script lang="ts">
import MailApp from './views/MailApp.vue'
import { defineComponent } from 'vue'

// resize 事件处理有性能损失，需要想办法做一个限流阀 resizeThrottler
// https://developer.mozilla.org/zh-CN/docs/Web/API/Window/resize_event
let resizeTimeout: number | null | NodeJS.Timeout = null

export default defineComponent({
  name: 'App',

  components: {
    MailApp,
  },

  data () {
    return {
    }
  },

  methods: {
    onResize (): void {
      for (let key in this.$layout) {
        let ele = this.$layout[key].ele
        this.$layout[key].handler(ele)
      }
    },


    resizeThrottler (): void {
      // ignore resize events as long as an actualResizeHandler execution is in the queue
      if ( !resizeTimeout ) {
        resizeTimeout = setTimeout(() => {
          resizeTimeout = null
          // The actualResizeHandler will execute at a rate of 15fps
          this.onResize()
        }, 66)
      }
    }
  },

  mounted () {
    this.onResize()


    window.addEventListener('resize', this.resizeThrottler, { passive: true })
  },

  unmounted () {
    window.removeEventListener('resize', this.resizeThrottler)
  }
})


</script>

<template>
  <MailApp arg="mail"></MailApp>
</template>

<style>
html, body {
  height: 100%;
  margin: 0;
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
</style>
