import { Link, useNavigate } from 'react-router-dom';

import { useCarrito } from '../context/useCarrito';
import { useAuth } from '../context/useAuth';

function Carrito() {
  const {
    carrito,
    aumentarCantidad,
    disminuirCantidad,
    eliminarDelCarrito,
  } = useCarrito();

  const { usuario } = useAuth();

  const navigate = useNavigate();

  const total = carrito.reduce(
    (suma, item) =>
      suma +
      Number(item.producto.precio) *
        item.cantidad,
    0
  );

  const tramitarPedido = () => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    navigate('/checkout');
  };

  return (
    <main>
      <div className="cart-header">
        <div>
          <p className="cart-subtitle">
            TU COMPRA
          </p>

          <h1>Carrito</h1>
        </div>

        <Link
          to="/"
          className="continue-shopping"
        >
          ← Seguir comprando
        </Link>
      </div>

      {carrito.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">
            🛒
          </div>

          <h2>Tu carrito está vacío</h2>

          <p>
            Añade algún producto para empezar
            tu compra.
          </p>

          <Link
            to="/"
            className="empty-cart-button"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {carrito.map((item) => (
              <article
                className="cart-item"
                key={item.producto.id}
              >
                <div className="cart-item-image">
                  {item.producto.imagen ? (
                    <img
                      src={item.producto.imagen}
                      alt={item.producto.nombre}
                    />
                  ) : (
                    <span>Sin imagen</span>
                  )}
                </div>

                <div className="cart-item-info">
                  <p className="cart-item-category">
                    {item.producto.categoria}
                  </p>

                  <h2>
                    {item.producto.nombre}
                  </h2>

                  <p className="cart-item-price">
                    {Number(
                      item.producto.precio
                    ).toFixed(2)}{' '}
                    €
                  </p>

                  <div className="cart-item-actions">
                    <div className="cart-item-quantity">
                      <button
                        type="button"
                        onClick={() =>
                          disminuirCantidad(
                            item.producto.id
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.cantidad}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          aumentarCantidad(
                            item.producto.id
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() =>
                        eliminarDelCarrito(
                          item.producto.id
                        )
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="cart-item-subtotal">
                  <span>Subtotal</span>

                  <strong>
                    {(
                      Number(
                        item.producto.precio
                      ) * item.cantidad
                    ).toFixed(2)}{' '}
                    €
                  </strong>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Resumen del pedido</h2>

            <div className="cart-summary-row">
              <span>Productos</span>

              <span>
                {carrito.reduce(
                  (total, item) =>
                    total + item.cantidad,
                  0
                )}
              </span>
            </div>

            <div className="cart-summary-row">
              <span>Subtotal</span>

              <span>
                {total.toFixed(2)} €
              </span>
            </div>

            <div className="cart-summary-row">
              <span>Envío</span>

              <span>Gratis</span>
            </div>

            <div className="cart-summary-total">
              <span>Total</span>

              <strong>
                {total.toFixed(2)} €
              </strong>
            </div>

            <button
              type="button"
              className="cart-checkout"
              onClick={tramitarPedido}
            >
              Tramitar pedido
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}

export default Carrito;