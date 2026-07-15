import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy API + Discovery calls to the Go backend on :8080 so the app can use
// same-origin relative URLs and dodge CORS entirely during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/discovery': 'http://localhost:8080',
    },
  },
})
