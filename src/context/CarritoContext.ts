import { createContext } from 'react';
import type { Producto } from '../types/Producto';

export interface ProductoCarrito {
  producto: Producto;
  cantidad: number;
}

export interface CarritoContextType {
  carrito: ProductoCarrito[];
  agregarAlCarrito: (producto: Producto) => void;
  eliminarDelCarrito: (id: number) => void;
  aumentarCantidad: (id: number) => void;
  disminuirCantidad: (id: number) => void;
  vaciarCarrito: () => void;
}

export const CarritoContext =
  createContext<CarritoContextType | undefined>(undefined);