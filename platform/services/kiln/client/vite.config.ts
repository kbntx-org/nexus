import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const devServerPort = 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    port: devServerPort
  },
  build: {
    outDir: 'dist'
  }
});
