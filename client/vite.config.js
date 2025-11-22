import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      external: ['crypto', 'fs', 'path', 'module'], // Exclude Node.js modules
    },
  },
  optimizeDeps: {
    exclude: ['nodemailer'], // Exclude nodemailer from dependency optimization
  },
});