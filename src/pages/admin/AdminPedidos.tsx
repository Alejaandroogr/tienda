import { useEffect, useState } from 'react';
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

  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const [paginaActual, setPaginaActual] = useState(1);

  const pedidosPorPagina = 10;

  useEffect(() => {
    const obtenerPedidos = async () => {
      try {
        setCargando(true);
        setError('');

        const respuesta = await fetch(
          'http://localhost/tienda/backend/pedidos/listar-admin.php',
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.error || 'No se han podido cargar los pedidos'
          );
        }

        setPedidos(datos);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('No se han podido cargar los pedidos');
        }
      } finally {
        setCargando(false);
      }
    };

    if (usuario?.rol === 'admin') {
      obtenerPedidos();
    }
  }, [usuario]);

  const cambiarEstado = async (
    pedidoId: number,
    nuevoEstado: string
  ) => {
    try {
      setMensaje('');
      setError('');

      const respuesta = await fetch(
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

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || 'No se ha podido cambiar el estado'
        );
      }

      setPedidos((pedidosActuales) =>
        pedidosActuales.map((pedido) =>
          pedido.id === pedidoId
            ? {
                ...pedido,
                estado: nuevoEstado,
              }
            : pedido
        )
      );

      setMensaje('Estado del pedido actualizado correctamente.');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('No se ha podido cambiar el estado');
      }
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    const coincideBusqueda =
      textoBusqueda === '' ||
      pedido.usuario_nombre
        .toLowerCase()
        .includes(textoBusqueda) ||
      pedido.usuario_email
        .toLowerCase()
        .includes(textoBusqueda) ||
      pedido.id.toString().includes(textoBusqueda);

    const coincideEstado =
      estadoFiltro === '' ||
      pedido.estado === estadoFiltro;

    return coincideBusqueda && coincideEstado;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      pedidosFiltrados.length / pedidosPorPagina
    )
  );

  /*
   * Evitamos modificar el estado desde un useEffect.
   * Si la página actual deja de existir después de aplicar
   * un filtro, simplemente mostramos la última página válida.
   */
  const paginaMostrada = Math.min(
    paginaActual,
    totalPaginas
  );

  const indiceUltimoPedido =
    paginaMostrada * pedidosPorPagina;

  const indicePrimerPedido =
    indiceUltimoPedido - pedidosPorPagina;

  const pedidosPagina = pedidosFiltrados.slice(
    indicePrimerPedido,
    indiceUltimoPedido
  );

  const cambiarBusqueda = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBusqueda(event.target.value);
    setPaginaActual(1);
  };

  const cambiarFiltroEstado = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setEstadoFiltro(event.target.value);
    setPaginaActual(1);
  };

  if (!usuario) {
    return (
      <main className="admin-container">
        <p>Acceso restringido.</p>
      </main>
    );
  }

  if (usuario.rol !== 'admin') {
    return (
      <main className="admin-container">
        <p>No tienes permisos para acceder a esta página.</p>
      </main>
    );
  }

  if (cargando) {
    return (
      <main className="admin-container">
        <p>Cargando pedidos...</p>
      </main>
    );
  }

  return (
    <main className="admin-container">
      <div className="admin-header">
        <div>
          <p className="admin-eyebrow">
            ADMINISTRACIÓN
          </p>

          <h1>Pedidos</h1>

          <p className="admin-subtitle">
            Gestiona los pedidos realizados por los
            clientes.
          </p>
        </div>

        <span className="admin-order-count">
          {pedidosFiltrados.length}{' '}
          {pedidosFiltrados.length === 1
            ? 'pedido'
            : 'pedidos'}
        </span>
      </div>

      {mensaje && (
        <div className="admin-success">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <section className="admin-section admin-orders">
        <div className="admin-section-header">
          <div>
            <h2>Lista de pedidos</h2>
          </div>
        </div>

        <div className="admin-orders-filters">
          <input
            type="text"
            className="admin-orders-search"
            placeholder="Buscar por cliente, email o ID..."
            value={busqueda}
            onChange={cambiarBusqueda}
          />

          <select
            className="admin-orders-status-filter"
            value={estadoFiltro}
            onChange={cambiarFiltroEstado}
          >
            <option value="">
              Todos los estados
            </option>

            {estados.map((estado) => (
              <option
                key={estado}
                value={estado}
              >
                {estado.charAt(0).toUpperCase() +
                  estado.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {pedidos.length === 0 ? (
          <div className="admin-empty">
            <p>No hay pedidos registrados.</p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="admin-empty">
            <p>
              No se han encontrado pedidos con esos
              filtros.
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-products-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {pedidosPagina.map((pedido) => (
                    <tr key={pedido.id}>
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
                        <strong>
                          {Number(
                            pedido.total
                          ).toFixed(2)}{' '}
                          €
                        </strong>
                      </td>

                      <td>
                        <select
                          className={`admin-order-status status-${pedido.estado}`}
                          value={pedido.estado}
                          onChange={(event) =>
                            cambiarEstado(
                              pedido.id,
                              event.target.value
                            )
                          }
                        >
                          {estados.map((estado) => (
                            <option
                              key={estado}
                              value={estado}
                            >
                              {estado
                                .charAt(0)
                                .toUpperCase() +
                                estado.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <button
                type="button"
                onClick={() =>
                  setPaginaActual((pagina) =>
                    Math.max(pagina - 1, 1)
                  )
                }
                disabled={paginaMostrada === 1}
              >
                ← Anterior
              </button>

              <div className="admin-pagination-pages">
                {Array.from(
                  { length: totalPaginas },
                  (_, indice) => indice + 1
                ).map((pagina) => (
                  <button
                    key={pagina}
                    type="button"
                    className={
                      pagina === paginaMostrada
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      setPaginaActual(pagina)
                    }
                  >
                    {pagina}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setPaginaActual((pagina) =>
                    Math.min(
                      pagina + 1,
                      totalPaginas
                    )
                  )
                }
                disabled={
                  paginaMostrada === totalPaginas
                }
              >
                Siguiente →
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default AdminPedidos;