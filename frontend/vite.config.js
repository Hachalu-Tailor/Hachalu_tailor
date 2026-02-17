import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
  },
  optimizeDeps: {
    include: ['react-icons/hi2', 'react-icons/hi', 'react-icons/md'],
    force: true,
  },
  clearScreen: false,
})
