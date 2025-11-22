import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      external: ['crypto', 'fs', 'path', 'module'],
    },
  },
  optimizeDeps: {
    include: ['react-is', 'recharts'],
    exclude: ['nodemailer'],
  },
  ssr: {
    noExternal: ['react-is', 'recharts']
  }
});
