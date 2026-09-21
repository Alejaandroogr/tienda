import type { Producto } from '../types/Producto';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  producto: Producto;
}

function ProductCard({ producto }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-image">
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
          />
        ) : (
          <span>Sin imagen</span>
        )}
      </div>

      <div className="product-info">
        <p className="product-category">
          {producto.categoria}
        </p>

        <h2>{producto.nombre}</h2>

        <p className="product-description">
          {producto.descripcion}
        </p>

        <p className="product-stock">
          Stock: {producto.stock}
        </p>

        <div className="product-bottom">
          <span className="product-price">
            {producto.precio} €
          </span>

          <Link
          to={`/productos/${producto.id}`}
          className="product-button"
        >
          Ver producto
        </Link>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;