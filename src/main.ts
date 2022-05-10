import { createApp } from 'vue'
import App from './App.vue'

import Resize from './resize'
createApp(App).directive('resize', Resize).mount('#app')
