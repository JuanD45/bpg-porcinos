import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // En desarrollo, /api se redirige a la API de NestJS
    proxy: { '/api': 'http://localhost:3000' },
  },
});
