import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useCarrito } from '../context/useCarrito';
import type { Producto } from '../types/Producto';
import { obtenerProductoPorId } from '../services/productosService';

function ProductoDetalle() {
  const { id } = useParams();
  const { agregarAlCarrito } = useCarrito();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

useEffect(() => {
  obtenerProductoPorId(Number(id))
    .then((datos) => {
      setProducto(datos);
    })
    .catch(() => {
      setError('No se ha podido cargar el producto');
    })
    .finally(() => {
      setCargando(false);
    });
}, [id]);

  if (cargando) {
    return <p>Cargando producto...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!producto) {
    return <p>Producto no encontrado</p>;
  }

return (
  <main>
    <div className="product-detail">
      <div className="product-detail-image">
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
          />
        ) : (
          <span>Sin imagen</span>
        )}
      </div>

      <div className="product-detail-info">
        <p className="product-detail-category">
          {producto.categoria}
        </p>

        <h1>{producto.nombre}</h1>

        <p className="product-detail-description">
          {producto.descripcion}
        </p>

        <p className="product-detail-stock">
          Stock disponible: {producto.stock}
        </p>

        <div className="product-detail-bottom">
          <span className="product-detail-price">
            {producto.precio} €
          </span>

          <button type="button" onClick={() => agregarAlCarrito(producto)}>
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  </main>
);
}

export default ProductoDetalle;