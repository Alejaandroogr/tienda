import type { Producto } from '../types/Producto';

const API_URL = 'http://localhost/tienda/backend/productos/listar.php';

export async function obtenerProductos(): Promise<Producto[]> {
  const respuesta = await fetch(API_URL);

  if (!respuesta.ok) {
    throw new Error('Error al obtener los productos');
  }

  return await respuesta.json();
}