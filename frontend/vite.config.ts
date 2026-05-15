import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    /** Dominios de túnel (Cloudflare, localtunnel, ngrok) para demo sin deploy. */
    allowedHosts: [
      '.trycloudflare.com',
      '.loca.lt',
      '.ngrok-free.app',
      '.ngrok.io',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
