import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useAuth } from '../../context/useAuth';

interface Categoria {
  id: number;
  nombre: string;
}

function AdminCategorias() {
  const { usuario } = useAuth();

  const [categorias, setCategorias] =
    useState<Categoria[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [categoriaEditando, setCategoriaEditando] =
    useState<Categoria | null>(null);

  const [nombre, setNombre] =
    useState('');

  const [guardando, setGuardando] =
    useState(false);

  const [eliminandoId, setEliminandoId] =
    useState<number | null>(null);

  const [busqueda, setBusqueda] =
    useState('');

  const [paginaActual, setPaginaActual] =
    useState(1);

  const categoriasPorPagina = 10;

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        setCargando(true);
        setError('');

        const respuesta =
          await fetch(
            'http://localhost/tienda/backend/categorias/listar.php'
          );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          setError(
            datos.error ||
              'No se han podido obtener las categorías'
          );

          return;
        }

        setCategorias(datos);

      } catch {
        setError(
          'No se ha podido conectar con el servidor'
        );
      } finally {
        setCargando(false);
      }
    };

    if (usuario?.rol === 'admin') {
      cargarCategorias();
    }

  }, [usuario]);

  const limpiarFormulario = () => {
    setNombre('');
    setMensaje('');
    setError('');
    setCategoriaEditando(null);
  };

  const recargarCategorias = async () => {
    const respuesta =
      await fetch(
        'http://localhost/tienda/backend/categorias/listar.php'
      );

    const datos =
      await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.error ||
          'No se han podido actualizar las categorías'
      );
    }

    setCategorias(datos);
  };

  const manejarNuevaCategoria = () => {
    limpiarFormulario();
    setMostrarFormulario(true);
  };

  const manejarEditarCategoria = (
    categoria: Categoria
  ) => {
    setCategoriaEditando(categoria);

    setNombre(categoria.nombre);

    setMensaje('');
    setError('');

    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    limpiararFormularioSeguro();
  };

  const limpiararFormularioSeguro = () => {
    setNombre('');
    setCategoriaEditando(null);
  };

  const manejarGuardarCategoria = async (
    evento: FormEvent<HTMLFormElement>
  ) => {
    evento.preventDefault();

    setError('');
    setMensaje('');

    if (nombre.trim() === '') {
      setError(
        'El nombre de la categoría es obligatorio'
      );

      return;
    }

    try {
      setGuardando(true);

      const esEdicion =
        categoriaEditando !== null;

      const url = esEdicion
        ? 'http://localhost/tienda/backend/categorias/editar.php'
        : 'http://localhost/tienda/backend/categorias/crear.php';

      const metodo = esEdicion
        ? 'PUT'
        : 'POST';

      const body = esEdicion
        ? {
            id: categoriaEditando.id,
            nombre: nombre.trim(),
          }
        : {
            nombre: nombre.trim(),
          };

      const respuesta =
        await fetch(url, {
          method: metodo,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(body),
        });

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            'No se ha podido guardar la categoría'
        );

        return;
      }

      await recargarCategorias();

      setMostrarFormulario(false);

      limpiarFormulario();

      setMensaje(
        datos.mensaje ||
          (
            esEdicion
              ? 'Categoría actualizada correctamente'
              : 'Categoría creada correctamente'
          )
      );

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          'No se ha podido conectar con el servidor'
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminarCategoria = async (
    categoria: Categoria
  ) => {
    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar la categoría "${categoria.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    setError('');
    setMensaje('');

    try {
      setEliminandoId(categoria.id);

      const respuesta =
        await fetch(
          'http://localhost/tienda/backend/categorias/eliminar.php',
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              id: categoria.id,
            }),
          }
        );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            'No se ha podido eliminar la categoría'
        );

        return;
      }

      await recargarCategorias();

      setMensaje(
        datos.mensaje ||
          'Categoría eliminada correctamente'
      );

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          'No se ha podido conectar con el servidor'
        );
      }
    } finally {
      setEliminandoId(null);
    }
  };

  /*
   * FILTRADO
   */

  const categoriasFiltradas =
    categorias.filter((categoria) => {
      const textoBusqueda =
        busqueda.trim().toLowerCase();

      return (
        textoBusqueda === '' ||
        categoria.nombre
          .toLowerCase()
          .includes(textoBusqueda) ||
        categoria.id
          .toString()
          .includes(textoBusqueda)
      );
    });

  /*
   * PAGINACIÓN
   */

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      categoriasFiltradas.length /
        categoriasPorPagina
    )
  );

  const paginaMostrada = Math.min(
    paginaActual,
    totalPaginas
  );

  const indiceUltimaCategoria =
    paginaMostrada * categoriasPorPagina;

  const indicePrimeraCategoria =
    indiceUltimaCategoria -
    categoriasPorPagina;

  const categoriasPagina =
    categoriasFiltradas.slice(
      indicePrimeraCategoria,
      indiceUltimaCategoria
    );

  const cambiarBusqueda = (
    evento: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBusqueda(evento.target.value);
    setPaginaActual(1);
  };

  /*
   * ACCESO
   */

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
            Cargando categorías...
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
              Categorías
            </h1>

            <p>
              Gestiona las categorías de la tienda.
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

        <section className="admin-products">

          <div className="admin-section-header">

            <div>

              <p className="admin-section-subtitle">
                CATÁLOGO
              </p>

              <h2>
                Lista de categorías
              </h2>

            </div>

            <div className="admin-category-header-actions">

              <span className="admin-order-count">
                {categoriasFiltradas.length}{' '}

                {categoriasFiltradas.length === 1
                  ? 'categoría'
                  : 'categorías'}
              </span>

              <button
                type="button"
                className="admin-primary-button"
                onClick={manejarNuevaCategoria}
              >
                Nueva categoría
              </button>

            </div>

          </div>

          {/* FILTRO */}

          <div className="admin-categories-filters">

            <input
              type="text"
              className="admin-categories-search"
              placeholder="Buscar por nombre o ID..."
              value={busqueda}
              onChange={cambiarBusqueda}
            />

          </div>

          {/* FORMULARIO */}

          {mostrarFormulario && (
            <div className="admin-form-card">

              <div className="admin-form-header">

                <div>

                  <p className="admin-section-subtitle">
                    CATEGORÍA
                  </p>

                  <h2>
                    {categoriaEditando
                      ? 'Editar categoría'
                      : 'Nueva categoría'}
                  </h2>

                </div>

                <button
                  type="button"
                  className="admin-close-button"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  ×
                </button>

              </div>

              <form
                className="admin-form"
                onSubmit={
                  manejarGuardarCategoria
                }
              >

                <div className="admin-form-grid">

                  <div className="form-group admin-form-full">

                    <label htmlFor="nombreCategoria">
                      Nombre de la categoría
                    </label>

                    <input
                      id="nombreCategoria"
                      type="text"
                      value={nombre}
                      onChange={(evento) =>
                        setNombre(
                          evento.target.value
                        )
                      }
                      placeholder="Ejemplo: Ordenadores"
                    />

                  </div>

                </div>

                <div className="admin-form-actions">

                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={cerrarFormulario}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="admin-primary-button"
                    disabled={guardando}
                  >
                    {guardando
                      ? 'Guardando...'
                      : categoriaEditando
                        ? 'Guardar cambios'
                        : 'Crear categoría'}
                  </button>

                </div>

              </form>

            </div>
          )}

          {/* TABLA */}

          {categorias.length === 0 ? (

            <div className="admin-empty">

              <p>
                No hay categorías registradas.
              </p>

            </div>

          ) : categoriasFiltradas.length === 0 ? (

            <div className="admin-empty">

              <p>
                No se han encontrado categorías
                con esa búsqueda.
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
                        Nombre
                      </th>

                      <th>
                        Acciones
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {categoriasPagina.map(
                      (categoria) => (

                        <tr
                          key={categoria.id}
                        >

                          <td>
                            #{categoria.id}
                          </td>

                          <td>
                            <strong>
                              {categoria.nombre}
                            </strong>
                          </td>

                          <td>

                            <div className="admin-product-actions">

                              <button
                                type="button"
                                onClick={() =>
                                  manejarEditarCategoria(
                                    categoria
                                  )
                                }
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  manejarEliminarCategoria(
                                    categoria
                                  )
                                }
                                disabled={
                                  eliminandoId ===
                                  categoria.id
                                }
                              >
                                {eliminandoId ===
                                categoria.id
                                  ? 'Eliminando...'
                                  : 'Eliminar'}
                              </button>

                            </div>

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

export default AdminCategorias;