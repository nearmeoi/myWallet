import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for assets
  preview: {
    allowedHosts: ['wallet.neardev.my.id', 'app.monev-absenbot.my.id']
  },
  server: {
    host: true
  }
})