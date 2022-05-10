import type { DirectiveBinding } from 'vue'

interface ResizeDirectiveBinding extends Omit<DirectiveBinding, 'modifiers'> {
  value: () => void
  modifiers?: {
    active?: boolean
    quiet?: boolean
  }
}

function mounted (el: HTMLElement, binding: ResizeDirectiveBinding) {
  const handler = binding.value

  // 其实这个 modifiers 是没有用的;
  // 一个思路是用针对每个元素来用 ResizeObserver，这是目前实现的

  // 另一个思路是将 ele & callback 加入到一个全局 hash table 里, 标识也一起传入
  // 在 window.resize 的时候, 即可以直接针对 ele 操作，也可以 callback 去操作
  const options: AddEventListenerOptions = {
    passive: !binding.modifiers?.active,
  }

  const resizeObserver = new ResizeObserver(handler)
  resizeObserver.observe(el)

  console.log(handler)
  console.log(options, el)
}

function unmounted (el: HTMLElement, binding: ResizeDirectiveBinding) {
}

export const Resize = {
  mounted,
  unmounted,
}

export default Resize
