import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Vercelではルートパスを使用
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 本番では不要
  },
})
