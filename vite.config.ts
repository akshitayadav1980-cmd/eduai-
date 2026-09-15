import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'motion/react': fileURLToPath(new URL('./node_modules/framer-motion', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        // Backend API target with safe environment variable fallback.
        // Groq API keys and credentials are kept strictly server-side in FastAPI backend (.env).
        // The client-side frontend never receives or exposes any Groq API keys.
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})

