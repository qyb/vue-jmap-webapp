import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
        "@": resolve(__dirname, 'src'), // 路径别名
    },
    extensions: ['.js', '.json', '.ts'] // 使用路径别名时想要省略的后缀名，可以自己 增减
  },
  server: {
    proxy: {
      "/jmap": {
        target: "http://localhost:8000/jmap",
        changeOrigin: true,
        timeout: 1000,
        rewrite: (path) => path.replace(/^\/jmap/, ""),
      },
    },
  },
  plugins: [vue()]
})
