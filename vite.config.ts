import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Exclude lottie-web from Vite's automatic dependency optimization
    exclude: ['lottie-web']
  },
  build: {
    sourcemap: false,
    minify: 'esbuild'
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy API calls in dev so you don't need CORS workarounds.
      // Change the target to your backend URL if it differs from .env
      '/api': {
        target: 'https://backend.arcmedialabs.in',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
