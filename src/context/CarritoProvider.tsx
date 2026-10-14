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

function validarCarritoGuardado(valor: unknown): ProductoCarrito[] {
  if (!Array.isArray(valor)) return [];

  const productosPorId = new Map<number, ProductoCarrito>();

  for (const elemento of valor) {
    if (!elemento || typeof elemento !== 'object') continue;
    const item = elemento as Partial<ProductoCarrito>;
    const producto = item.producto;
    const cantidad = item.cantidad;

    if (
      !producto ||
      !Number.isSafeInteger(producto.id) || producto.id <= 0 ||
      typeof producto.nombre !== 'string' ||
      typeof producto.descripcion !== 'string' ||
      typeof producto.precio !== 'string' ||
      !Number.isFinite(Number(producto.precio)) || Number(producto.precio) < 0 ||
      !Number.isSafeInteger(producto.stock) || producto.stock < 0 ||
      (typeof producto.imagen !== 'string' && producto.imagen !== null) ||
      typeof producto.categoria !== 'string' ||
      typeof cantidad !== 'number' ||
      !Number.isSafeInteger(cantidad) || cantidad <= 0 || producto.stock === 0
    ) continue;

    const cantidadLimitada = Math.min(cantidad, producto.stock);
    const existente = productosPorId.get(producto.id);
    productosPorId.set(producto.id, {
      producto,
      cantidad: Math.min(producto.stock, cantidadLimitada + (existente?.cantidad ?? 0)),
    });
  }

  return [...productosPorId.values()];
}

export function CarritoProvider({
  children,
}: CarritoProviderProps) {
  const [carrito, setCarrito] = useState<ProductoCarrito[]>(
    () => {
      try {
        const carritoGuardado = localStorage.getItem('carrito');
        return carritoGuardado ? validarCarritoGuardado(JSON.parse(carritoGuardado)) : [];
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
    if (producto.stock <= 0) {
      toast.error('Este producto está sin stock');
      return;
    }

    const existente = carrito.find((item) => item.producto.id === producto.id);
    if (existente && existente.cantidad >= producto.stock) {
      toast.error('No puedes superar el stock disponible');
      return;
    }

    setCarrito((carritoActual) => {
      const productoExistente =
        carritoActual.find(
          (item) =>
            item.producto.id === producto.id
        );

      if (productoExistente) {
        if (productoExistente.cantidad >= producto.stock) return carritoActual;
        return carritoActual.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                producto,
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
    const item = carrito.find((producto) => producto.producto.id === id);
    if (!item || item.cantidad >= item.producto.stock) {
      toast.error('No puedes superar el stock disponible');
      return;
    }

    setCarrito((carritoActual) =>
      carritoActual.map((item) =>
        item.producto.id === id
          && item.cantidad < item.producto.stock
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
