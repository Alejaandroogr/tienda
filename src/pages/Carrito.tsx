import {
  ArrowRight,
  Minus,
  PackageOpen,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/useCarrito';
import { useAuth } from '../context/useAuth';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { formatearPrecio } from '../lib/formato';

function Carrito() {
  const { carrito, aumentarCantidad, disminuirCantidad, eliminarDelCarrito } = useCarrito();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const total = carrito.reduce((suma, item) => suma + Number(item.producto.precio) * item.cantidad, 0);
  const unidades = carrito.reduce((suma, item) => suma + item.cantidad, 0);

  return (
    <main className="store-cart-page">
      <div className="store-page-heading"><div><p className="eyebrow">TU COMPRA</p><h1>Carrito</h1><p>Revisa tus productos antes de continuar.</p></div><Link className="store-back-link" to="/#productos">Seguir comprando <ArrowRight size={16} /></Link></div>
      {!carrito.length ? (
        <Card className="store-empty-cart">
          <ShoppingCart size={42} aria-hidden="true" />
          <h2>Tu carrito está vacío</h2>
          <p>
            Explora nuestro catálogo y encuentra productos que te interesen.
          </p>
          <Button
            size="lg"
            render={<Link to="/#productos" />}
          >
            Explorar catálogo <ArrowRight size={16} />
          </Button>
        </Card>
      ) : (
        <div className="store-cart-layout">
          <section className="store-cart-items" aria-label="Productos en el carrito">
            {carrito.map(({ producto, cantidad }) => <Card className="store-cart-item" key={producto.id}>
              <Link to={`/productos/${producto.id}`} className="store-cart-image">{producto.imagen ? <img src={producto.imagen} alt={producto.nombre} /> : <PackageOpen size={25} />}</Link>
              <div className="store-cart-product-info"><Badge variant="secondary">{producto.categoria}</Badge><Link to={`/productos/${producto.id}`}><h2>{producto.nombre}</h2></Link><p>{formatearPrecio(producto.precio)} / unidad</p>
                <div className="store-cart-controls"><div className="store-quantity" aria-label={`Cantidad: ${cantidad}`}><Button variant="outline" size="icon-sm" aria-label="Reducir cantidad" onClick={() => disminuirCantidad(producto.id)}><Minus size={14} /></Button><span>{cantidad}</span><Button variant="outline" size="icon-sm" aria-label="Aumentar cantidad" onClick={() => aumentarCantidad(producto.id)} disabled={cantidad >= producto.stock}><Plus size={14} /></Button></div><Button variant="ghost" className="store-remove-button" onClick={() => eliminarDelCarrito(producto.id)}><Trash2 size={15} /> Quitar</Button></div>
              </div>
              <strong className="store-cart-subtotal">{formatearPrecio(Number(producto.precio) * cantidad)}</strong>
            </Card>)}
          </section>
          <Card className="store-cart-summary"><p className="eyebrow">RESUMEN</p><h2>Tu pedido</h2><div className="store-summary-line"><span>Productos ({unidades})</span><span>{formatearPrecio(total)}</span></div><div className="store-summary-line"><span>Envío</span><Badge variant="secondary">Gratis</Badge></div><Separator /><div className="store-summary-total"><span>Total</span><strong>{formatearPrecio(total)}</strong></div><p className="store-tax-note">Impuestos incluidos</p><Button size="lg" className="store-checkout-button" onClick={() => navigate(usuario ? '/checkout' : '/login')}>Continuar al checkout <ArrowRight size={16} /></Button><div className="store-summary-assurance"><ShieldCheck size={16} /> Pago seguro · <Truck size={16} /> Envío gratuito</div></Card>
        </div>
      )}
    </main>
  );
}

export default Carrito;
