import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Use esbuild for minification (built-in, faster than terser)
    minify: 'esbuild',
    // Aggressive tree-shaking
    target: 'es2020',
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk - rarely changes, cached long-term
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI library chunk
          ui: ['@headlessui/react', '@heroicons/react'],
          // Data fetching chunk
          query: ['@tanstack/react-query', 'axios'],
          // Animation chunk (if still used elsewhere)
          motion: ['framer-motion'],
        },
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 500,
  },
});

