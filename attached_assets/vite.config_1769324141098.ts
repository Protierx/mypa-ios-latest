import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,

    // Allow Cloudflare Quick Tunnel hostnames (they change every run)
    allowedHosts: ['.trycloudflare.com'],

    // (optional) keep this too if you still use localtunnel sometimes:
    // allowedHosts: ['.trycloudflare.com', '.loca.lt'],
  },

  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
