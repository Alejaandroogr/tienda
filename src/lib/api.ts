/**
 * URL base del backend PHP.
 *
 * En desarrollo (npm run dev) es una ruta relativa: el servidor de Vite la reenvía
 * a Apache (server.proxy en vite.config.ts). Así el navegador solo habla con un
 * origen, la página y la API comparten cookie de sesión, y todo funciona también
 * desde otro dispositivo de la red con npm run dev -- --host.
 *
 * En producción (npm run build) se mantiene la URL absoluta de siempre.
 * import.meta.env no existe fuera de Vite (tests de Node): ahí se usa la de producción.
 */
export const API_URL = import.meta.env?.DEV ? '/tienda/backend' : 'http://localhost/tienda/backend';
