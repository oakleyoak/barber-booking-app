import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.jpg', '**/*.JPG'],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist'
  }
})
