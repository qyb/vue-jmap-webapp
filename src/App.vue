<script lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import HelloWorld from './components/HelloWorld.vue'
import block from './components/block.vue'
import BlockTwo from './components/BlockTwo.vue'
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'App',

  components: {
    HelloWorld,
    block,
    BlockTwo,
  },

  data () {
    return {
      height: 0,
      width: 0
    }
  },

  methods: {
    // Cross-browser support as described in:
    // https://stackoverflow.com/questions/1248081
    getClientWidth (): number {
      return Math.max(
        document.documentElement!.clientWidth,
        window.innerWidth
      )
    },
    getClientHeight (): number {
      return Math.max(
        document.documentElement!.clientHeight,
        window.innerHeight
      )
    },
    onResize (): void {
      this.height = this.getClientHeight()
      this.width = this.getClientWidth()

      for (let key in this.$layout) {
        let ele = this.$layout[key].ele
        this.$layout[key].handler(ele)
      }
    },
  },

  mounted () {
    this.onResize()

    // 这里还是有性能损失，需要想办法做一个限流阀
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Window/resize_event
    window.addEventListener('resize', this.onResize, { passive: true })
  },

  unmounted () {
    window.removeEventListener('resize', this.onResize)
  }
})


</script>

<template>
  <div>
  <img alt="Vue logo" src="./assets/logo.png" style="margin-top: 60px"/>
  <HelloWorld msg="Hello Vue 3 + TypeScript + Vite" />
  <div>{{ width }}, {{ height }}</div>
  </div>
  <div style="flex:1; display: flex; justify-content: space-around;align-items: center;">
    <BlockTwo arg="foo"></BlockTwo>
    <BlockTwo arg="bar"></BlockTwo>
    <block></block>
  </div>
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
