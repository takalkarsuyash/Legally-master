import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/upload': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/retrieve': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  define: {
    // Provide empty process.env object to fix "process is not defined" error
    'process.env': {},
    // For IPFS libraries that check for the Node.js process
    'global': {},
    // Hardcode VITE_SERVER_URL to empty string to enforce relative paths and proxying
    'import.meta.env.VITE_SERVER_URL': JSON.stringify(''),
  },
  resolve: {
    alias: {
      // For packages that use Node.js modules
      process: 'process/browser',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
  },
})
