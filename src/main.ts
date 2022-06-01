import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import { Layout } from '@/directives/resize'
import { $globalState } from '@/utils/global'
const app = createApp(App)

const site = import.meta.env.VITE_APP_TITLE ? import.meta.env.VITE_APP_TITLE : 'JMAP Webmail'

router.beforeEach((to, from, next) => {
  to.meta && (typeof to.meta.title !== 'undefined' && (()=>{document.title = `${to.meta.title} - ${site}`})())
  if (to.path === '/guest/login') {
    if ($globalState.permission === -1) {
      next()
    } else {
      next({ path: '/app/mail' })
    }
  } else {
    if ($globalState.permission === -1) {
      if (to.name === 'signup') {
        next()
      } else {
        next({ path: '/guest/login', query: { redirect: to.path } })
      }
    } else {
      next()
    }
  }
})

app.directive('layout', Layout).use(router).mount('#app')
