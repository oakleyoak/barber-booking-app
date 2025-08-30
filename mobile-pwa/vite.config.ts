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
    outDir: 'dist',
    // Prevent noisy warnings by increasing the threshold slightly and
    // split large vendor libraries into separate chunks to improve caching.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return;
          if (id.includes('node_modules')) {
            // Prefer splitting React and other large libs into their own chunk
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/@supabase') || id.includes('node_modules/supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
