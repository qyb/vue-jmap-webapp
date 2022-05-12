import { createApp } from 'vue'
import App from './App.vue'

import { Layout, layoutRegister } from '@/directives/resize'
const app = createApp(App).use(layoutRegister).directive('layout', Layout)
app.mount('#app')
