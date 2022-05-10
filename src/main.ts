import { createApp } from 'vue'
import App from './App.vue'

import Resize from './resize'
import { Layout, layoutRegister } from './layout'
createApp(App).use(layoutRegister).directive('layout', Layout).directive('resize', Resize).mount('#app')
