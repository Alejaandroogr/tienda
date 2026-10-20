import {
  useState,
  type FormEvent,
} from 'react';

import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import { useCarrito } from '../context/useCarrito';
import { useAuth } from '../context/useAuth';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { formatearPrecio } from '../lib/formato';

function Checkout() {
  const {
    carrito,
    vaciarCarrito,
  } = useCarrito();

  const { usuario } = useAuth();

  const navigate = useNavigate();

  const [cargando, setCargando] =
    useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(false);

  const total = carrito.reduce(
    (suma, item) =>
      suma +
      Number(item.producto.precio) *
        item.cantidad,
    0
  );

  // navigate() durante el render no hace nada y dejaba la página en blanco.
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (pedidoCreado) {
    return (
      <main className="store-message-page">
        <Card className="store-success-card">
          <div className="store-success-icon">✓</div>
          <p className="eyebrow">PEDIDO CONFIRMADO</p>
          <h1>¡Gracias por tu compra!</h1>
          <p>Hemos recibido tu pedido correctamente. Puedes consultar el estado desde tu cuenta.</p>
          <div className="store-success-actions">
            <Button
              size="lg"
              render={<Link to="/pedidos" />}
            >
              Ver mis pedidos
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link to="/" />}
            >
              Volver a la tienda
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  if (carrito.length === 0) {
    return (
      <main>
        <div className="empty-cart">
          <h2>
            Tu carrito está vacío
          </h2>

          <p>
            Añade algún producto antes de
            tramitar el pedido.
          </p>

          <Button render={<Link to="/" />}>Ver productos</Button>
        </div>
      </main>
    );
  }

  const confirmarPedido = async (
    evento: FormEvent
  ) => {
    evento.preventDefault();

    try {
      setCargando(true);

      const respuesta = await fetch(
        'http://localhost/tienda/backend/pedidos/crear.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            productos: carrito.map((item) => ({
              producto_id: item.producto.id,
              cantidad: item.cantidad,
            })),
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        toast.error(
          datos.error ||
            'No se ha podido crear el pedido'
        );

        return;
      }

      vaciarCarrito();
      setPedidoCreado(true);
    } catch {
      toast.error(
        'No se ha podido conectar con el servidor'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <main>
      <div className="checkout-container">
        <div className="checkout-header">
          <p className="cart-subtitle">
            FINALIZAR COMPRA
          </p>

          <h1>Confirmar pedido</h1>

          <p>
            Revisa los datos de tu pedido antes
            de confirmar la compra.
          </p>
        </div>

        <div className="checkout-layout">
          <Card className="checkout-section">
            <h2>
              Datos del cliente
            </h2>

            <div className="checkout-user">
              <div>
                <span>Nombre</span>

                <strong>
                  {usuario.nombre}
                </strong>
              </div>

              <div>
                <span>
                  Correo electrónico
                </span>

                <strong>
                  {usuario.email}
                </strong>
              </div>
            </div>

            <h2>Productos</h2>

            <div className="checkout-products">
              {carrito.map((item) => (
                <article
                  className="checkout-product"
                  key={item.producto.id}
                >
                  <div className="checkout-product-image">
                    {item.producto.imagen ? (
                      <img
                        src={item.producto.imagen}
                        alt={
                          item.producto.nombre
                        }
                      />
                    ) : (
                      <span>
                        Sin imagen
                      </span>
                    )}
                  </div>

                  <div className="checkout-product-info">
                    <h3>
                      {item.producto.nombre}
                    </h3>

                    <p>
                      Cantidad:{' '}
                      {item.cantidad}
                    </p>
                  </div>

                  <strong>
                    {formatearPrecio(Number(item.producto.precio) * item.cantidad)}
                  </strong>
                </article>
              ))}
            </div>
          </Card>

          <aside className="checkout-summary">
            <h2>Resumen</h2>

            <div className="checkout-summary-row">
              <span>
                Productos
              </span>

              <span>
                {carrito.reduce(
                  (cantidad, item) =>
                    cantidad +
                    item.cantidad,
                  0
                )}
              </span>
            </div>

            <div className="checkout-summary-row">
              <span>Envío</span>

              <span>Gratis</span>
            </div>

            <div className="checkout-summary-total">
              <span>Total</span>

              <strong>
                {formatearPrecio(total)}
              </strong>
            </div>

            <Separator />
            <form
              onSubmit={confirmarPedido}
            >
              <Button
                type="submit"
                className="cart-checkout"
                disabled={cargando}
              >
                {cargando
                  ? 'Procesando pedido...'
                  : 'Confirmar pedido'}
              </Button>
            </form>

            <Button
              variant="ghost"
              type="button"
              className="checkout-back"
              onClick={() =>
                navigate('/carrito')
              }
              disabled={cargando}
            >
              ← Volver al carrito
            </Button>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Checkout;
