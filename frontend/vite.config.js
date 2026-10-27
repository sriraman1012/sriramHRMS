import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // bind to 0.0.0.0 so other machines on the LAN can reach it
    port: 5173,
    // Dev-only: forward relative "/api" calls (config.js apiBaseUrl: '/api') to the
    // backend so the dev server works the same as single-site production hosting.
    proxy: {
      '/api': { target: 'http://localhost:5080', changeOrigin: true },
    },
  },
})
