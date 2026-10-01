import {
  ArrowUpRight,
  Cpu,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Producto } from '../types/Producto';
import { useCarrito } from '../context/useCarrito';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ProductCardProps {
  producto: Producto;
}

function ProductCard({ producto }: ProductCardProps) {
  const { agregarAlCarrito } = useCarrito();
  const disponible = producto.stock > 0;

  return (
    <Card className="product-card store-product-card">
      <Link
        to={`/productos/${producto.id}`}
        className="store-product-visual"
        aria-label={`Ver ${producto.nombre}`}
      >
        <Badge variant="secondary" className="store-product-category">
          {producto.categoria}
        </Badge>

        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="store-product-placeholder">
            <Cpu size={38} strokeWidth={1.2} />
            <span>Imagen próximamente</span>
          </div>
        )}

        <span className="store-product-detail-hint">
          Ver detalles <ArrowUpRight size={15} />
        </span>
      </Link>

      <div className="product-info store-product-info">
        <div className="store-product-heading">
          <Link
            to={`/productos/${producto.id}`}
            className="store-product-title"
          >
            {producto.nombre}
          </Link>
          <p className="product-description">{producto.descripcion}</p>
        </div>

        <div className="store-product-stockline">
          <span
            className={disponible ? 'stock-dot is-available' : 'stock-dot'}
          />
          <span>{disponible ? `${producto.stock} disponibles` : 'Agotado'}</span>
          <span className="store-warranty">
            <ShieldCheck size={14} /> Garantía oficial
          </span>
        </div>

        <div className="product-bottom store-product-bottom">
          <span className="product-price">
            {Number(producto.precio).toFixed(2)} <small>€</small>
          </span>
          <Button
            onClick={() => agregarAlCarrito(producto)}
            disabled={!disponible}
            aria-label={`Añadir ${producto.nombre} al carrito`}
          >
            <Plus size={16} /> Añadir
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ProductCard;
