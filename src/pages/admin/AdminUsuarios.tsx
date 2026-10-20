import {
  useEffect,
  useState,
} from 'react';

import { useAuth } from '../../context/useAuth';
import AdminPagination from '../../components/admin/AdminPagination';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import TablaAdaptable from '../../components/TablaAdaptable';
import { toast } from 'sonner';
import { API_URL } from '../../lib/api';

interface UsuarioAdmin {
  id: number;
  nombre: string;
  email: string;
  rol: 'cliente' | 'admin';
  creado_en: string;
}

// Con items, SelectValue muestra la etiqueta y no el valor interno.
const opcionesRol = [
  { label: 'Cliente', value: 'cliente' },
  { label: 'Administrador', value: 'admin' },
];
const opcionesFiltroRol = [
  { label: 'Todos los roles', value: 'todos' },
  { label: 'Clientes', value: 'cliente' },
  { label: 'Administradores', value: 'admin' },
];

function AdminUsuarios() {
  const { usuario } = useAuth();

  const [usuarios, setUsuarios] =
    useState<UsuarioAdmin[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  const [actualizandoId, setActualizandoId] =
    useState<number | null>(null);

  const [busqueda, setBusqueda] =
    useState('');

  const [rolFiltro, setRolFiltro] =
    useState('');

  const [paginaActual, setPaginaActual] =
    useState(1);

  const usuariosPorPagina = 8;

  useEffect(() => { if (mensaje) toast.success(mensaje); }, [mensaje]);
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        setCargando(true);
        setError('');

        const respuesta =
          await fetch(
            `${API_URL}/usuarios/listar-admin.php`,
            {
              credentials: 'include',
            }
          );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          setError(
            datos.error ||
              'No se han podido obtener los usuarios'
          );

          return;
        }

        setUsuarios(datos);

      } catch {
        setError(
          'No se ha podido conectar con el servidor'
        );
      } finally {
        setCargando(false);
      }
    };

    if (usuario?.rol === 'admin') {
      cargarUsuarios();
    }

  }, [usuario]);

  const cambiarRol = async (
    usuarioId: number,
    nuevoRol: 'cliente' | 'admin'
  ) => {
    if (!usuario) return;
    if (usuarioId === usuario.id) {
      setError('No puedes cambiar el rol de tu propia cuenta.');
      return;
    }

    setError('');
    setMensaje('');

    try {
      setActualizandoId(usuarioId);

      const respuesta =
        await fetch(
          `${API_URL}/usuarios/cambiar-rol.php`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              id: usuarioId,
              rol: nuevoRol,
            }),
          }
        );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            'No se ha podido cambiar el rol'
        );

        return;
      }

      setUsuarios(
        (usuariosActuales) =>
          usuariosActuales.map(
            (usuarioActual) =>
              usuarioActual.id === usuarioId
                ? {
                    ...usuarioActual,
                    rol: nuevoRol,
                  }
                : usuarioActual
          )
      );

      setMensaje(
        datos.mensaje ||
          'Rol actualizado correctamente'
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

  /*
   * FILTRAR USUARIOS
   */
  const usuariosFiltrados =
    usuarios.filter((usuarioActual) => {
      const textoBusqueda =
        busqueda.trim().toLowerCase();

      const coincideBusqueda =
        textoBusqueda === '' ||
        usuarioActual.nombre
          .toLowerCase()
          .includes(textoBusqueda) ||
        usuarioActual.email
          .toLowerCase()
          .includes(textoBusqueda) ||
        usuarioActual.id
          .toString()
          .includes(textoBusqueda);

      const coincideRol =
        rolFiltro === '' ||
        usuarioActual.rol === rolFiltro;

      return (
        coincideBusqueda &&
        coincideRol
      );
    });

  /*
   * PAGINACIÓN
   */
  const totalPaginas = Math.max(
    1,
    Math.ceil(
      usuariosFiltrados.length /
        usuariosPorPagina
    )
  );

  const paginaMostrada = Math.min(
    paginaActual,
    totalPaginas
  );

  const indiceInicio =
    (paginaMostrada - 1) * usuariosPorPagina;
  const indiceFin = indiceInicio + usuariosPorPagina;
  const usuariosPagina = usuariosFiltrados.slice(
    indiceInicio,
    indiceFin
  );

  /*
   * CAMBIAR BÚSQUEDA
   */
  const cambiarBusqueda = (
    evento: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBusqueda(evento.target.value);
    setPaginaActual(1);
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

        <div className="admin-message admin-table-skeleton" aria-label="Cargando usuarios" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>

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
              Usuarios
            </h1>

            <p>
              Gestiona los usuarios registrados
              en la tienda.
            </p>

          </div>

        </div>

        <section className="admin-users">

          <div className="admin-section-header">

            <div>

              <p className="admin-section-subtitle">
                CUENTAS
              </p>

              <h2>
                Usuarios registrados
              </h2>

            </div>

            <span className="admin-order-count">

              {usuariosFiltrados.length}{' '}

              {usuariosFiltrados.length === 1
                ? 'usuario'
                : 'usuarios'}

            </span>

          </div>

          {/* FILTROS */}

          <div className="admin-users-filters">

            <Input
              type="text"
              className="admin-users-search"
              placeholder="Buscar por nombre, email o ID..."
              value={busqueda}
              onChange={cambiarBusqueda}
            />

            <Select items={opcionesFiltroRol} value={rolFiltro || 'todos'} onValueChange={(value) => { setRolFiltro(!value || value === 'todos' ? '' : value); setPaginaActual(1); }}>
              <SelectTrigger className="admin-filter-select" aria-label="Filtrar por rol"><SelectValue /></SelectTrigger>
              <SelectContent>{opcionesFiltroRol.map((opcion) => <SelectItem key={opcion.value} value={opcion.value}>{opcion.label}</SelectItem>)}</SelectContent>
            </Select>

          </div>

          {usuarios.length === 0 ? (

            <div className="admin-empty">

              <p>
                No hay usuarios registrados.
              </p>

            </div>

          ) : usuariosFiltrados.length === 0 ? (

            <div className="admin-empty">

              <p>
                No se han encontrado usuarios
                con esos filtros.
              </p>

            </div>

          ) : (

            <>

              <div className="admin-products-table">

                <TablaAdaptable className="admin-data-table">

                  <thead>

                    <tr>

                      <th>
                        ID
                      </th>

                      <th>
                        Usuario
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Fecha de registro
                      </th>

                      <th>
                        Rol
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {usuariosPagina.map(
                      (usuarioActual) => (

                        <tr
                          key={
                            usuarioActual.id
                          }
                        >

                          <td data-label="ID">
                            #{usuarioActual.id}
                          </td>

                          <td data-label="Usuario">

                            <strong>
                              {
                                usuarioActual.nombre
                              }
                            </strong>

                          </td>

                          <td data-label="Email">
                            {
                              usuarioActual.email
                            }
                          </td>

                          <td data-label="Fecha de registro">
                            {formatearFecha(
                              usuarioActual.creado_en
                            )}
                          </td>

                          <td data-label="Rol">

                            <div className="admin-user-role-cell">
                              <Badge variant={usuarioActual.rol === 'admin' ? 'default' : 'secondary'} className={`role-badge role-${usuarioActual.rol}`}>{usuarioActual.rol === 'admin' ? 'Administrador' : 'Cliente'}</Badge>
                              <Select items={opcionesRol} value={usuarioActual.rol} disabled={usuarioActual.id === usuario.id || actualizandoId === usuarioActual.id} onValueChange={(value) => { if (value === 'cliente' || value === 'admin') void cambiarRol(usuarioActual.id, value); }}>
                                <SelectTrigger className="admin-role-select" aria-label={`Cambiar rol de ${usuarioActual.nombre}`}><SelectValue /></SelectTrigger>
                                <SelectContent>{opcionesRol.map((opcion) => <SelectItem key={opcion.value} value={opcion.value}>{opcion.label}</SelectItem>)}</SelectContent>
                              </Select>
                              {usuarioActual.id === usuario.id && <small className="admin-self-role-note">Tu cuenta</small>}
                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </TablaAdaptable>

              </div>

              {/* PAGINACIÓN */}

              <AdminPagination
                paginaActual={paginaMostrada}
                totalPaginas={totalPaginas}
                alCambiarPagina={setPaginaActual}
                ariaLabel="Paginación de usuarios"
              />

            </>

          )}

        </section>

      </div>

    </main>
  );
}

export default AdminUsuarios;
