import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, PackageCheck } from 'lucide-react';
import { useCarrito } from '../context/useCarrito';
import type { Producto } from '../types/Producto';
import { obtenerProductoPorId } from '../services/productosService';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';

function ProductoDetalle() {
  const { id } = useParams();
  const { agregarAlCarrito } = useCarrito();
  const [resultado, setResultado] = useState<{
    id: string;
    producto: Producto | null;
    error: string;
  }>({ id: '', producto: null, error: '' });
  const cargando = resultado.id !== (id ?? '');
  const producto = resultado.id === (id ?? '') ? resultado.producto : null;
  const error = resultado.id === (id ?? '') ? resultado.error : '';

  useEffect(() => {
    obtenerProductoPorId(Number(id))
      .then((datos) =>
        setResultado({ id: id ?? '', producto: datos, error: '' }),
      )
      .catch(() =>
        setResultado({
          id: id ?? '',
          producto: null,
          error: 'No se ha podido cargar el producto.',
        }),
      );
  }, [id]);

  if (cargando) {
    return (
      <main className="product-detail-shell">
        <Card className="store-detail-skeleton">
          <div />
          <span />
        </Card>
      </main>
    );
  }

  if (error || !producto) {
    return (
      <main className="store-message-page">
        <PackageCheck size={34} />
        <h1>Producto no disponible</h1>
        <p>{error || 'No se ha encontrado este producto.'}</p>
        <Button render={<Link to="/" />}>Volver a productos</Button>
      </main>
    );
  }

  const agregar = () => {
    agregarAlCarrito(producto);
  };

  return (
    <main className="product-detail-shell">
      <Link to="/#productos" className="store-back-link">
        <ArrowLeft size={16} /> Volver al catálogo
      </Link>
      <div className="store-detail-layout">
        <Card className="store-detail-gallery">
          {producto.imagen ? (
            <img src={producto.imagen} alt={producto.nombre} />
          ) : (
            <div className="store-detail-placeholder">
              <PackageCheck size={58} />
              <span>Imagen próximamente</span>
            </div>
          )}
        </Card>
        <section className="store-detail-info">
          <Badge variant="secondary" className="store-detail-category">
            {producto.categoria}
          </Badge>
          <p className="eyebrow store-detail-eyebrow">DETALLE DEL PRODUCTO</p>
          <h1>{producto.nombre}</h1>
          <p className="store-detail-description">{producto.descripcion}</p>
          <Badge
            variant={producto.stock > 0 ? 'secondary' : 'destructive'}
            className="store-detail-stock-badge"
          >
            {producto.stock > 0
              ? `En stock · ${producto.stock} unidades`
              : 'Agotado'}
          </Badge>
          <Card className="store-purchase-card">
            <div className="store-detail-price">
              {Number(producto.precio).toFixed(2)} <span>€</span>
            </div>
            <Button
              size="lg"
              onClick={agregar}
              disabled={producto.stock <= 0}
            >
              {producto.stock > 0 ? 'Añadir al carrito' : 'Sin stock'}
            </Button>
          </Card>
          <p className="store-stock-note">La disponibilidad puede variar según el stock actual.</p>
        </section>
      </div>
    </main>
  );
}

export default ProductoDetalle;
