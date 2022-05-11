import { createApp } from 'vue'
import App from './App.vue'

// import Resize from './resize'
import { Layout, layoutRegister } from './layout'
const app = createApp(App).use(layoutRegister).directive('layout', Layout)
app.mount('#app')
