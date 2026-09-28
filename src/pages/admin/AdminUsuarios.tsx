import {
  useEffect,
  useState,
} from 'react';

import { useAuth } from '../../context/useAuth';

interface UsuarioAdmin {
  id: number;
  nombre: string;
  email: string;
  rol: 'cliente' | 'admin';
  creado_en: string;
}

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

  const usuariosPorPagina = 10;

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        setCargando(true);
        setError('');

        const respuesta =
          await fetch(
            'http://localhost/tienda/backend/usuarios/listar-admin.php',
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
    setError('');
    setMensaje('');

    try {
      setActualizandoId(usuarioId);

      const respuesta =
        await fetch(
          'http://localhost/tienda/backend/usuarios/cambiar-rol.php',
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

  const indiceUltimoUsuario =
    paginaMostrada * usuariosPorPagina;

  const indicePrimerUsuario =
    indiceUltimoUsuario -
    usuariosPorPagina;

  const usuariosPagina =
    usuariosFiltrados.slice(
      indicePrimerUsuario,
      indiceUltimoUsuario
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

  /*
   * CAMBIAR FILTRO DE ROL
   */
  const cambiarFiltroRol = (
    evento: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRolFiltro(evento.target.value);
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

        <div className="admin-message">

          <p>
            Cargando usuarios...
          </p>

        </div>

      </main>
    );
  }

  if (
    error &&
    usuarios.length === 0
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
              Usuarios
            </h1>

            <p>
              Gestiona los usuarios registrados
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

            <input
              type="text"
              className="admin-users-search"
              placeholder="Buscar por nombre, email o ID..."
              value={busqueda}
              onChange={cambiarBusqueda}
            />

            <select
              className="admin-users-role-filter"
              value={rolFiltro}
              onChange={cambiarFiltroRol}
            >

              <option value="">
                Todos los roles
              </option>

              <option value="cliente">
                Clientes
              </option>

              <option value="admin">
                Administradores
              </option>

            </select>

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

                <table>

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

                          <td>
                            #{usuarioActual.id}
                          </td>

                          <td>

                            <strong>
                              {
                                usuarioActual.nombre
                              }
                            </strong>

                          </td>

                          <td>
                            {
                              usuarioActual.email
                            }
                          </td>

                          <td>
                            {formatearFecha(
                              usuarioActual.creado_en
                            )}
                          </td>

                          <td>

                            <select
                              className={`admin-user-role role-${usuarioActual.rol}`}
                              value={
                                usuarioActual.rol
                              }
                              disabled={
                                usuarioActual.id ===
                                  usuario.id ||
                                actualizandoId ===
                                  usuarioActual.id
                              }
                              onChange={(
                                evento
                              ) =>
                                cambiarRol(
                                  usuarioActual.id,
                                  evento.target
                                    .value as
                                    | 'cliente'
                                    | 'admin'
                                )
                              }
                            >

                              <option value="cliente">
                                Cliente
                              </option>

                              <option value="admin">
                                Administrador
                              </option>

                            </select>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* PAGINACIÓN */}

              <div className="admin-pagination">

                <button
                  type="button"
                  onClick={() =>
                    setPaginaActual(
                      (pagina) =>
                        Math.max(
                          pagina - 1,
                          1
                        )
                    )
                  }
                  disabled={
                    paginaMostrada === 1
                  }
                >
                  ← Anterior
                </button>

                <div className="admin-pagination-pages">

                  {Array.from(
                    {
                      length: totalPaginas,
                    },
                    (_, indice) =>
                      indice + 1
                  ).map((pagina) => (

                    <button
                      key={pagina}
                      type="button"
                      className={
                        pagina ===
                        paginaMostrada
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setPaginaActual(
                          pagina
                        )
                      }
                    >
                      {pagina}
                    </button>

                  ))}

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPaginaActual(
                      (pagina) =>
                        Math.min(
                          pagina + 1,
                          totalPaginas
                        )
                    )
                  }
                  disabled={
                    paginaMostrada ===
                    totalPaginas
                  }
                >
                  Siguiente →
                </button>

              </div>

            </>

          )}

        </section>

      </div>

    </main>
  );
}

export default AdminUsuarios;