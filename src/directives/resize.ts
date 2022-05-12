import type { DirectiveBinding, App } from 'vue'

interface layoutElement {
  ele: HTMLElement
  handler: (ele: HTMLElement) => void
}

interface layoutElementMap {
  [key: string]: layoutElement
}

const globalLayout: layoutElementMap = {}

function mounted (el: HTMLElement, binding: DirectiveBinding) {
  const handler = binding.value
  const key = binding.arg

  if (!key) {
    console.error('layoutMounted Nokey')
    return
  }
  if (key in globalLayout) {
    console.error('layoutMounted Conflict')
    return
  }

  globalLayout[key] = {
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
  delete globalLayout[key]
}

const Layout = {
  mounted,
  unmounted
}

const layoutRegister = {
  install: (app: App) => {
    app.config.globalProperties.$layout = globalLayout
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $layout: layoutElementMap
  }
}

// Cross-browser support as described in:
// https://stackoverflow.com/questions/1248081
function getClientWidth (): number {
  return Math.max(
    document.documentElement!.clientWidth,
    window.innerWidth
  )
}
function getClientHeight (): number {
  return Math.max(
    document.documentElement!.clientHeight,
    window.innerHeight
  )
}

export {
  Layout,
  layoutRegister,
  // globalLayout,
  getClientWidth, getClientHeight,
}
