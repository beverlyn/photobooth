import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  base: '/photobooth/',
  plugins: [react(), basicSsl()],
  server: {
    // This makes the server accessible on your local network
    host: true,
  },
})
