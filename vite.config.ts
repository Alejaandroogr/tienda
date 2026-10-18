import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      // Sin __dirname: no existe en ESM ni en el cargador nativo de configuración de Vite.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});