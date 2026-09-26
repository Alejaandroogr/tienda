import {
  useState,
  type FormEvent,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useCarrito } from '../context/useCarrito';
import { useAuth } from '../context/useAuth';

function Checkout() {
  const {
    carrito,
    vaciarCarrito,
  } = useCarrito();

  const { usuario } = useAuth();

  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [cargando, setCargando] =
    useState(false);

  const total = carrito.reduce(
    (suma, item) =>
      suma +
      Number(item.producto.precio) *
        item.cantidad,
    0
  );

  if (!usuario) {
    navigate('/login');
    return null;
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

          <Link
            to="/"
            className="empty-cart-button"
          >
            Ver productos
          </Link>
        </div>
      </main>
    );
  }

  const confirmarPedido = async (
    evento: FormEvent
  ) => {
    evento.preventDefault();

    setError('');

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
        setError(
          datos.error ||
            'No se ha podido crear el pedido'
        );

        return;
      }

      console.log(
        'Pedido creado:',
        datos
      );

      vaciarCarrito();

      navigate('/');
    } catch {
      setError(
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
          <section className="checkout-section">
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
                    {(
                      Number(
                        item.producto.precio
                      ) *
                      item.cantidad
                    ).toFixed(2)}{' '}
                    €
                  </strong>
                </article>
              ))}
            </div>
          </section>

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
                {total.toFixed(2)} €
              </strong>
            </div>

            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            <form
              onSubmit={confirmarPedido}
            >
              <button
                type="submit"
                className="cart-checkout"
                disabled={cargando}
              >
                {cargando
                  ? 'Procesando pedido...'
                  : 'Confirmar pedido'}
              </button>
            </form>

            <button
              type="button"
              className="checkout-back"
              onClick={() =>
                navigate('/carrito')
              }
              disabled={cargando}
            >
              ← Volver al carrito
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Checkout;