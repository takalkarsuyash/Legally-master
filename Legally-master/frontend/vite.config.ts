import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Provide empty process.env object to fix "process is not defined" error
    'process.env': {},
    // For IPFS libraries that check for the Node.js process
    'global': {},
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
