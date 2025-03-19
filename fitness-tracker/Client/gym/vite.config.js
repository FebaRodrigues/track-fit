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
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material']
        }
      }
    }
  },
  define: {
    'import.meta.env.VITE_USE_CORS_PROXY': JSON.stringify('true')
  }
})
