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
      "/.well-known": {
        target: "http://localhost:8008/.well-known",
        changeOrigin: true,
        timeout: 1000,
        rewrite: (path) => path.replace(/^\/\.well-known/, ""),
        /**
         * default vite port is 3000.
         * browser -> vite-dev-server: http://localhost:3000/.well-known/jmap
         * vite-dev-server -> backend: http://localhost:8008/.well-known/jmap
         * cyrus-imapd redirect .well-known/jmap to http://localhost:8008/jmap
         * `autoRewrite` rewrite it as http://localhost:3000/jmap return to browser
         */
        autoRewrite: true,
      },
      "/jmap": {
        target: "http://localhost:8008/jmap",
        changeOrigin: true,
        timeout: 1000,
        rewrite: (path) => path.replace(/^\/jmap/, ""),
      },
    },
  },
  plugins: [vue()]
})
