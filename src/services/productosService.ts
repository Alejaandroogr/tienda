import type { Producto } from '../types/Producto';
import { API_URL } from '../lib/api';

const URL_LISTAR_PRODUCTOS = `${API_URL}/productos/listar.php`;

export async function obtenerProductos(): Promise<Producto[]> {
  const respuesta = await fetch(URL_LISTAR_PRODUCTOS);

  if (!respuesta.ok) {
    throw new Error('Error al obtener los productos');
  }

  return await respuesta.json();
}

export async function obtenerProductoPorId(
  id: number
): Promise<Producto> {
  const respuesta = await fetch(
    `${API_URL}/productos/obtener.php?id=${id}`
  );

  if (!respuesta.ok) {
    throw new Error('Producto no encontrado');
  }

  return await respuesta.json();
}