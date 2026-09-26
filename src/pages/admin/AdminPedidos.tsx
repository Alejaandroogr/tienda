import {
  useEffect,
  useState,
} from 'react';

import { useAuth } from '../../context/useAuth';

interface PedidoAdmin {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  usuario_email: string;
  total: string;
  estado: string;
  creado_en: string;
}

const estados = [
  'pendiente',
  'procesando',
  'enviado',
  'entregado',
  'cancelado',
];

function AdminPedidos() {
  const { usuario } = useAuth();

  const [pedidos, setPedidos] =
    useState<PedidoAdmin[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  const [actualizandoId, setActualizandoId] =
    useState<number | null>(null);

  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        setCargando(true);
        setError('');

        const respuesta =
          await fetch(
            'http://localhost/tienda/backend/pedidos/listar-admin.php',
            {
              credentials: 'include',
            }
          );

        const datos =
          await respuesta.json();

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

    if (usuario?.rol === 'admin') {
      cargarPedidos();
    }

  }, [usuario]);

  const cambiarEstado = async (
    pedidoId: number,
    nuevoEstado: string
  ) => {
    setError('');
    setMensaje('');

    try {
      setActualizandoId(pedidoId);

      const respuesta =
        await fetch(
          'http://localhost/tienda/backend/pedidos/cambiar-estado.php',
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              pedido_id: pedidoId,
              estado: nuevoEstado,
            }),
          }
        );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            'No se ha podido cambiar el estado'
        );

        return;
      }

      setPedidos(
        (pedidosActuales) =>
          pedidosActuales.map(
            (pedido) =>
              pedido.id === pedidoId
                ? {
                    ...pedido,
                    estado: nuevoEstado,
                  }
                : pedido
          )
      );

      setMensaje(
        datos.mensaje ||
          'Estado actualizado correctamente'
      );

    } catch {
      setError(
        'No se ha podido conectar con el servidor'
      );
    } finally {
      setActualizandoId(null);
    }
  };

  const formatearFecha = (
    fecha: string
  ) => {
    return new Date(fecha).toLocaleString(
      'es-ES',
      {
        dateStyle: 'short',
        timeStyle: 'short',
      }
    );
  };

  if (!usuario) {
    return (
      <main>

        <div className="admin-message">
          <h1>
            Acceso restringido
          </h1>

          <p>
            Debes iniciar sesión para acceder
            al panel de administración.
          </p>
        </div>
      </main>
    );
  }

  if (usuario.rol !== 'admin') {
    return (
      <main>

        <div className="admin-message">
          <h1>
            Acceso denegado
          </h1>

          <p>
            No tienes permisos para acceder
            al panel de administración.
          </p>
        </div>
      </main>
    );
  }

  if (cargando) {
    return (
      <main>

        <div className="admin-message">
          <p>
            Cargando pedidos...
          </p>
        </div>
      </main>
    );
  }

  if (
    error &&
    pedidos.length === 0
  ) {
    return (
      <main>

        <div className="admin-message admin-error">
          <p>
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>

      <div className="admin-container">

        <div className="admin-header">

          <div>

            <p className="admin-subtitle">
              ADMINISTRACIÓN
            </p>

            <h1>
              Pedidos
            </h1>

            <p>
              Gestiona los pedidos realizados
              en la tienda.
            </p>

          </div>

        </div>

        {mensaje && (
          <div className="admin-success-message">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="admin-error-message">
            {error}
          </div>
        )}

        <section className="admin-orders">

          <div className="admin-section-header">

            <div>

              <p className="admin-section-subtitle">
                VENTAS
              </p>

              <h2>
                Todos los pedidos
              </h2>

            </div>

            <span className="admin-order-count">
              {pedidos.length}{' '}

              {pedidos.length === 1
                ? 'pedido'
                : 'pedidos'}
            </span>

          </div>

          <div className="admin-products-table">

            <table>

              <thead>

                <tr>

                  <th>
                    ID
                  </th>

                  <th>
                    Cliente
                  </th>

                  <th>
                    Fecha
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Estado
                  </th>

                </tr>

              </thead>

              <tbody>

                {pedidos.length === 0 ? (

                  <tr>

                    <td
                      colSpan={5}
                      className="admin-empty"
                    >
                      No hay pedidos registrados.
                    </td>

                  </tr>

                ) : (

                  pedidos.map(
                    (pedido) => (

                      <tr
                        key={pedido.id}
                      >

                        <td>
                          #{pedido.id}
                        </td>

                        <td>

                          <div className="admin-order-client">

                            <strong>
                              {pedido.usuario_nombre}
                            </strong>

                            <span>
                              {pedido.usuario_email}
                            </span>

                          </div>

                        </td>

                        <td>
                          {formatearFecha(
                            pedido.creado_en
                          )}
                        </td>

                        <td>
                          {Number(
                            pedido.total
                          ).toFixed(2)} €
                        </td>

                        <td>

                          <select
                            className={`admin-order-status status-${pedido.estado}`}
                            value={
                              pedido.estado
                            }
                            disabled={
                              actualizandoId ===
                              pedido.id
                            }
                            onChange={(evento) =>
                              cambiarEstado(
                                pedido.id,
                                evento.target.value
                              )
                            }
                          >

                            {estados.map(
                              (estado) => (

                                <option
                                  key={estado}
                                  value={estado}
                                >
                                  {estado
                                    .charAt(0)
                                    .toUpperCase() +
                                    estado.slice(1)}
                                </option>

                              )
                            )}

                          </select>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>

    </main>
  );
}

export default AdminPedidos;