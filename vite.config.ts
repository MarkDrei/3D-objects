import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5199, host: '127.0.0.1' },
  build: { chunkSizeWarningLimit: 1500 },
});
