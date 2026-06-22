import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite configuration
 *
 * Environment variables are read from .env files:
 *   .env                → shared defaults
 *   .env.development    → local dev overrides
 *   .env.production     → production build overrides
 *
 * Required variable:
 *   VITE_API_URL   e.g. http://172.16.16.108:5000   (dev)
 *                  e.g. https://api.yourdomain.com   (prod)
 *
 * In production the proxy is not used — the browser calls VITE_API_URL directly.
 * In development the Vite dev server proxies /api and /socket.io to VITE_API_URL
 * so the browser never has to deal with cross-origin or CORS during local dev.
 */
export default defineConfig(({ mode }) => {
  // Load env file for the current mode so we can use it inside vite.config.js
  // (import.meta.env is NOT available here — this runs in Node.js)
  const env = loadEnv(mode, process.cwd(), '')

  const apiUrl = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_PORT) || 5173,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        // All /api requests are proxied to the backend during development
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
        // Socket.IO requires WebSocket upgrade — ws:true enables that
        '/socket.io': {
          target: apiUrl,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  }
})
