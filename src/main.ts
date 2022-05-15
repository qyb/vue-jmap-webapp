import { createApp } from 'vue'
import App from './App.vue'

import { Layout } from '@/directives/resize'
const app = createApp(App)

app.directive('layout', Layout).mount('#app')
