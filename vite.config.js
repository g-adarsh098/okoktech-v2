import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // This forces Vite to use only ONE instance of React for all packages
    dedupe: ['react', 'react-dom'],
  },
})