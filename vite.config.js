import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy for /api and /discovery so the app can use same-origin relative
// URLs and dodge CORS in development (mirrors the vercel.json rewrite in prod).
//
// Defaults to the deployed backend so `npm run dev` works with no local server.
// Running the Go backend locally? Start it and set:
//   VITE_DEV_API=http://localhost:8080
// changeOrigin rewrites the Host header — required so Vercel routes to the
// right deployment instead of returning DEPLOYMENT_NOT_FOUND.
const target = process.env.VITE_DEV_API || 'https://ticketmaster-backend-eight.vercel.app'
const proxy = {
  '/api': { target, changeOrigin: true, secure: true },
  '/discovery': { target, changeOrigin: true, secure: true },
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
})
