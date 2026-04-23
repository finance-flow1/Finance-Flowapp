import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Per-service proxy rules that mirror nginx.conf so `npm run dev`
    // works locally without Docker and without changing any app code.
    // Order matters: more-specific paths must come first.
    proxy: {
      '/api/v1/auth':          { target: 'http://localhost:5001', changeOrigin: true },
      '/api/v1/users':         { target: 'http://localhost:5001', changeOrigin: true },
      '/api/v1/transactions':  { target: 'http://localhost:5002', changeOrigin: true },
      '/api/v1/notifications': { target: 'http://localhost:5003', changeOrigin: true },
    },
  },
});
