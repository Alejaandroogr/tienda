import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/useAuth';

interface Pedido {
  id: number;
  usuario_id: number;
  total: string;
  estado: string;
  creado_en: string;
}

function Pedidos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    const obtenerPedidos = async () => {
      try {
        setCargando(true);
        setError('');

        const respuesta = await fetch(
          'http://localhost/tienda/backend/pedidos/listar.php',
          {
            credentials: 'include',
          }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          setError(
            datos.error ||
              'No se han podido obtener los pedidos'
          );
          return;
        }

        setPedidos(datos);
      } catch {
        setError(
          'No se ha podido conectar con el servidor'
        );
      } finally {
        setCargando(false);
      }
    };

    obtenerPedidos();
  }, [usuario, navigate]);

  if (!usuario) {
    return null;
  }

  return (
    <main>
      <div className="orders-container">
        <div className="orders-header">
          <div>
            <p className="cart-subtitle">
              TU CUENTA
            </p>

            <h1>Mis pedidos</h1>

            <p>
              Consulta todos los pedidos que has
              realizado.
            </p>
          </div>

          <Link
            to="/"
            className="continue-shopping"
          >
            ← Seguir comprando
          </Link>
        </div>

        {cargando && (
          <div className="orders-message">
            <p>
              Cargando pedidos...
            </p>
          </div>
        )}

        {error && (
          <div className="orders-message orders-error">
            <p>{error}</p>
          </div>
        )}

        {!cargando &&
          !error &&
          pedidos.length === 0 && (
            <div className="orders-empty">
              <div className="empty-cart-icon">
                📦
              </div>

              <h2>
                Todavía no tienes pedidos
              </h2>

              <p>
                Cuando realices una compra,
                aparecerá aquí.
              </p>

              <Link
                to="/"
                className="empty-cart-button"
              >
                Ver productos
              </Link>
            </div>
          )}

        {!cargando &&
          !error &&
          pedidos.length > 0 && (
            <div className="orders-list">
              {pedidos.map((pedido) => (
                <article
                  className="order-card"
                  key={pedido.id}
                >
                  <div className="order-card-main">
                    <div>
                      <span className="order-label">
                        Pedido
                      </span>

                      <h2>
                        #{pedido.id}
                      </h2>
                    </div>

                    <div>
                      <span className="order-label">
                        Fecha
                      </span>

                      <p>
                        {new Date(
                          pedido.creado_en
                        ).toLocaleDateString(
                          'es-ES'
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="order-label">
                        Estado
                      </span>

                      <span
                        className={`order-status order-status-${pedido.estado}`}
                      >
                        {pedido.estado}
                      </span>
                    </div>

                    <div>
                      <span className="order-label">
                        Total
                      </span>

                      <strong>
                        {Number(
                          pedido.total
                        ).toFixed(2)}{' '}
                        €
                      </strong>
                    </div>
                  </div>

                  <div className="order-card-actions">
                    <Link
                      to={`/pedidos/${pedido.id}`}
                      className="order-view-button"
                    >
                      Ver pedido
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
      </div>
    </main>
  );
}

export default Pedidos;