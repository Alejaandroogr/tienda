import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type { Producto } from '../types/Producto';
import { toast } from 'sonner';
import {
  CarritoContext,
  type ProductoCarrito,
} from './CarritoContext';

interface CarritoProviderProps {
  children: ReactNode;
}

export function CarritoProvider({
  children,
}: CarritoProviderProps) {
  const [carrito, setCarrito] = useState<ProductoCarrito[]>(
    () => {
      const carritoGuardado =
        localStorage.getItem('carrito');

      if (!carritoGuardado) {
        return [];
      }

      try {
        return JSON.parse(carritoGuardado);
      } catch {
        return [];
      }
    }
  );

  useEffect(() => {
    localStorage.setItem(
      'carrito',
      JSON.stringify(carrito)
    );
  }, [carrito]);

  const agregarAlCarrito = (
    producto: Producto
  ) => {
    setCarrito((carritoActual) => {
      const productoExistente =
        carritoActual.find(
          (item) =>
            item.producto.id === producto.id
        );

      if (productoExistente) {
        return carritoActual.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
              }
            : item
        );
      }

      return [
        ...carritoActual,
        {
          producto,
          cantidad: 1,
        },
      ];
    });

    toast.success('Producto añadido al carrito');
  };

  const eliminarDelCarrito = (
    id: number
  ) => {
    setCarrito((carritoActual) =>
      carritoActual.filter(
        (item) =>
          item.producto.id !== id
      )
    );

    toast.success('Producto eliminado del carrito');
  };

  const aumentarCantidad = (
    id: number
  ) => {
    setCarrito((carritoActual) =>
      carritoActual.map((item) =>
        item.producto.id === id
          ? {
              ...item,
              cantidad: item.cantidad + 1,
            }
          : item
      )
    );
  };

  const disminuirCantidad = (
    id: number
  ) => {
    setCarrito((carritoActual) =>
      carritoActual
        .map((item) =>
          item.producto.id === id
            ? {
                ...item,
                cantidad: item.cantidad - 1,
              }
            : item
        )
        .filter(
          (item) => item.cantidad > 0
        )
    );
  };

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        agregarAlCarrito,
        eliminarDelCarrito,
        aumentarCantidad,
        disminuirCantidad,
        vaciarCarrito,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}
