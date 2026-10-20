import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// Origen que el backend admite para el frontend (RECOMENDACIONES_ORIGEN_FRONTEND y cabeceras CORS).
const ORIGEN_FRONTEND = 'http://localhost:5173';

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

  // Solo en desarrollo (npm run dev). En desarrollo el frontend llama a /tienda/backend
  // (src/lib/api.ts) y Vite lo reenvía a Apache: el navegador ve un único origen, así que
  // la cookie de sesión funciona también desde otro dispositivo (npm run dev -- --host).
  server: {
    proxy: {
      '/tienda/backend': {
        target: 'http://localhost',
        changeOrigin: true,
        configure: (proxy) => {
          // Desde otro dispositivo el navegador envía Origin http://<ip>:5173, que el backend
          // no admite. Solo se sustituye cuando la petición viene de la propia app (su Origin
          // es el mismo servidor de Vite); cualquier otro origen llega tal cual y se rechaza.
          proxy.on('proxyReq', (proxyReq, req) => {
            const origen = req.headers.origin;

            if (origen !== undefined && origen === `http://${req.headers.host}`) {
              proxyReq.setHeader('Origin', ORIGEN_FRONTEND);
            }
          });
        },
      },
    },
  },
});
