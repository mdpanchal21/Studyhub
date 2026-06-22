import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: false,
    proxy: {
      '/api': {
        target: 'http://172.16.16.108:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://172.16.16.108:5000',
        ws: true,
      },
    },
  },
})
