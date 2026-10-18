import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import AdminPagination from '../../components/admin/AdminPagination';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import TablaAdaptable from '../../components/TablaAdaptable';
import { toast } from 'sonner';

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

const etiquetaEstado = (estado: string) => estado.charAt(0).toUpperCase() + estado.slice(1);

// Con items, SelectValue muestra la etiqueta y no el valor interno.
const opcionesEstado = estados.map((estado) => ({ label: etiquetaEstado(estado), value: estado }));
const opcionesFiltroEstado = [{ label: 'Todos los estados', value: 'todos' }, ...opcionesEstado];

// Debe coincidir con TRANSICIONES_PEDIDO de backend/pedidos/estados_pedido.php.
const TRANSICIONES_PEDIDO: Record<string, readonly string[]> = {
  pendiente: ['procesando', 'cancelado'],
  procesando: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
};

/** El estado actual y los estados a los que se puede pasar desde él. */
function estadosDisponibles(estadoActual: string): string[] {
  return [estadoActual, ...(TRANSICIONES_PEDIDO[estadoActual] ?? [])];
}

function AdminPedidos() {
  const { usuario } = useAuth();

  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const [paginaActual, setPaginaActual] = useState(1);

  const pedidosPorPagina = 8;

  useEffect(() => { if (mensaje) toast.success(mensaje); }, [mensaje]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

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
      setActualizandoId(pedidoId);
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

      setMensaje(datos.mensaje || 'Estado del pedido actualizado correctamente.');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('No se ha podido cambiar el estado');
      }
    } finally {
      setActualizandoId(null);
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

  const indiceInicio =
    (paginaMostrada - 1) * pedidosPorPagina;
  const indiceFin = indiceInicio + pedidosPorPagina;
  const pedidosPagina = pedidosFiltrados.slice(
    indiceInicio,
    indiceFin
  );

  const cambiarBusqueda = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBusqueda(event.target.value);
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
        <div className="admin-table-skeleton" aria-label="Cargando pedidos" aria-busy="true">{Array.from({ length: 6 }, (_, row) => <Skeleton key={row} className="h-12 w-full" />)}</div>
      </main>
    );
  }

  return (
    <main className="admin-container">
      <div className="admin-header">
        <div>
          <p className="admin-subtitle">
            ADMINISTRACIÓN
          </p>

          <h1>Pedidos</h1>

          <p>
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

      <section className="admin-section admin-orders">
        <div className="admin-section-header">
          <div>
            <h2>Lista de pedidos</h2>
          </div>
        </div>

        <div className="admin-orders-filters">
          <Input
            type="text"
            className="admin-orders-search"
            placeholder="Buscar por cliente, email o ID..."
            value={busqueda}
            onChange={cambiarBusqueda}
          />

          <Select items={opcionesFiltroEstado} value={estadoFiltro || 'todos'} onValueChange={(value) => { setEstadoFiltro(!value || value === 'todos' ? '' : value); setPaginaActual(1); }}>
            <SelectTrigger className="admin-filter-select" aria-label="Filtrar por estado"><SelectValue /></SelectTrigger>
            <SelectContent>
              {opcionesFiltroEstado.map((opcion) => <SelectItem key={opcion.value} value={opcion.value}>{opcion.label}</SelectItem>)}
            </SelectContent>
          </Select>
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
              <TablaAdaptable className="admin-products-table">
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
                      <td data-label="ID">
                        #{pedido.id}
                      </td>

                      <td data-label="Cliente">
                        <div className="admin-order-client">
                          <strong>
                            {pedido.usuario_nombre}
                          </strong>

                          <span>
                            {pedido.usuario_email}
                          </span>
                        </div>
                      </td>

                      <td data-label="Fecha">
                        {formatearFecha(
                          pedido.creado_en
                        )}
                      </td>

                      <td data-label="Total">
                        <strong>
                          {Number(
                            pedido.total
                          ).toFixed(2)}{' '}
                          €
                        </strong>
                      </td>

                      <td data-label="Estado">
                        <div className="admin-order-state-cell">
                        <Badge variant={pedido.estado === 'cancelado' ? 'destructive' : pedido.estado === 'entregado' ? 'secondary' : pedido.estado === 'enviado' ? 'default' : 'outline'} className={`admin-state-badge state-${pedido.estado}`}>{pedido.estado}</Badge>
                        <Select items={opcionesEstado} value={pedido.estado} onValueChange={(value) => { if (value && value !== pedido.estado) void cambiarEstado(pedido.id, value); }}>
                          <SelectTrigger
                            className={`admin-order-status status-${pedido.estado}`}
                            disabled={actualizandoId === pedido.id || (TRANSICIONES_PEDIDO[pedido.estado] ?? []).length === 0}
                            title={(TRANSICIONES_PEDIDO[pedido.estado] ?? []).length === 0 ? `Un pedido ${pedido.estado} no puede cambiar de estado` : undefined}
                          ><SelectValue /></SelectTrigger>
                          <SelectContent>{estadosDisponibles(pedido.estado).map((estado) => <SelectItem key={estado} value={estado}>{etiquetaEstado(estado)}</SelectItem>)}</SelectContent>
                        </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TablaAdaptable>
            </div>

            <AdminPagination
              paginaActual={paginaMostrada}
              totalPaginas={totalPaginas}
              alCambiarPagina={setPaginaActual}
              ariaLabel="Paginación de pedidos"
            />
          </>
        )}
      </section>
    </main>
  );
}

export default AdminPedidos;
