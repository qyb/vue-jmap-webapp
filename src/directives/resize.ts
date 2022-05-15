import type { DirectiveBinding, App } from 'vue'
import { $globalLayout } from '@/utils/global'

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
