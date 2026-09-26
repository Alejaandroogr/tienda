import { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { useAuth } from '../context/useAuth';

interface DetallePedido {
  id: number;
  producto_id: number;
  cantidad: number;
  precio: string;
  nombre: string;
  imagen: string | null;
}

interface Pedido {
  id: number;
  usuario_id: number;
  total: string;
  estado: string;
  creado_en: string;
  detalles: DetallePedido[];
}

function PedidoDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [pedido, setPedido] =
    useState<Pedido | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    const obtenerPedido = async () => {
      try {
        setCargando(true);
        setError('');

        const respuesta = await fetch(
          `http://localhost/tienda/backend/pedidos/obtener.php?id=${id}&usuario_id=${usuario.id}`
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          setError(
            datos.error ||
              'No se ha podido obtener el pedido'
          );
          return;
        }

        setPedido(datos);
      } catch {
        setError(
          'No se ha podido conectar con el servidor'
        );
      } finally {
        setCargando(false);
      }
    };

    obtenerPedido();
  }, [id, usuario, navigate]);

  if (!usuario) {
    return null;
  }

  if (cargando) {
    return (
      <main>
        <div className="order-detail-message">
          <p>
            Cargando pedido...
          </p>
        </div>
      </main>
    );
  }

  if (error || !pedido) {
    return (
      <main>
        <div className="order-detail-message order-detail-error">
          <h2>
            No se ha podido cargar el pedido
          </h2>

          <p>
            {error ||
              'El pedido no existe.'}
          </p>

          <Link
            to="/pedidos"
            className="empty-cart-button"
          >
            ← Volver a mis pedidos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="order-detail-container">
        <div className="order-detail-header">
          <div>
            <p className="cart-subtitle">
              DETALLE DEL PEDIDO
            </p>

            <h1>
              Pedido #{pedido.id}
            </h1>

            <p>
              Realizado el{' '}
              {new Date(
                pedido.creado_en
              ).toLocaleDateString(
                'es-ES'
              )}
            </p>
          </div>

          <Link
            to="/pedidos"
            className="continue-shopping"
          >
            ← Mis pedidos
          </Link>
        </div>

        <div className="order-detail-layout">
          <section className="order-detail-products">
            <div className="order-detail-section-header">
              <h2>
                Productos
              </h2>

              <span
                className={`order-status order-status-${pedido.estado}`}
              >
                {pedido.estado}
              </span>
            </div>

            <div className="order-detail-list">
              {pedido.detalles.map(
                (detalle) => (
                  <article
                    className="order-detail-product"
                    key={detalle.id}
                  >
                    <div className="order-detail-product-image">
                      {detalle.imagen ? (
                        <img
                          src={detalle.imagen}
                          alt={
                            detalle.nombre
                          }
                        />
                      ) : (
                        <span>
                          Sin imagen
                        </span>
                      )}
                    </div>

                    <div className="order-detail-product-info">
                      <h3>
                        {detalle.nombre}
                      </h3>

                      <p>
                        Cantidad:{' '}
                        {detalle.cantidad}
                      </p>

                      <p>
                        Precio unitario:{' '}
                        {Number(
                          detalle.precio
                        ).toFixed(2)}{' '}
                        €
                      </p>
                    </div>

                    <strong>
                      {(
                        Number(
                          detalle.precio
                        ) *
                        detalle.cantidad
                      ).toFixed(2)}{' '}
                      €
                    </strong>
                  </article>
                )
              )}
            </div>
          </section>

          <aside className="order-detail-summary">
            <h2>
              Resumen
            </h2>

            <div className="order-detail-summary-row">
              <span>
                Productos
              </span>

              <span>
                {pedido.detalles.reduce(
                  (total, detalle) =>
                    total +
                    detalle.cantidad,
                  0
                )}
              </span>
            </div>

            <div className="order-detail-summary-row">
              <span>
                Estado
              </span>

              <span className="order-status">
                {pedido.estado}
              </span>
            </div>

            <div className="order-detail-summary-total">
              <span>
                Total
              </span>

              <strong>
                {Number(
                  pedido.total
                ).toFixed(2)}{' '}
                €
              </strong>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default PedidoDetalle;