import type { DirectiveBinding, App } from 'vue'
import { $globalLayout } from '@/utils/global'

/*
  所有调用 v-layout 的 HTMLElement 都必须传入 arg 参数，作用是：
    1. 插入 $globalLayout Object 以在 App.vue 处理 resize event 时遍历
    2. unmount 时可以从 Object 中删除
 */
function mounted (el: HTMLElement, binding: DirectiveBinding) {
  const handler = binding.value
  const key = binding.arg

  if (!key) {
    console.error('layoutMounted Nokey')
    return
  }
  if (key in $globalLayout) {
    console.error('layoutMounted Conflict')
    return
  }

  $globalLayout[key] = {
    ele: el,
    handler: handler
  }
}

function unmounted (el: HTMLElement, binding: DirectiveBinding) {
  const key = binding.arg

  if (!key) {
    console.error('layoutMounted Nokey')
    return
  }
  delete $globalLayout[key]
}

const Layout = {
  mounted,
  unmounted
}

export { Layout }
