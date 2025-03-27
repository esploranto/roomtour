import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
    hmr: {
      overlay: false
    }
  },
  optimizeDeps: {
    include: [
      'canvas-confetti', 
      '@dnd-kit/core', 
      '@dnd-kit/sortable', 
      '@dnd-kit/utilities', 
      'lucide-react', 
      '@radix-ui/react-slot'
    ]
  },
  build: {
    target: 'esnext',
    minify: false,
    sourcemap: false
  }
})