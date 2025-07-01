import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://8080-firebase-note-1751078190988.cluster-6dx7corvpngoivimwvvljgokdw.cloudworkstations.dev',
        changeOrigin: true,
        secure: false,
      },
    },
    host: '0.0.0.0',
    port: 5173
  }
})
