import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // Force the use of port 5173, fail if not available
    host: true, // Listen on all addresses
    open: true, // Open browser automatically
    cors: true, // Enable CORS
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 5173,
    strictPort: true, // Force the use of port 5173 for preview mode as well
    open: true
  }
})
