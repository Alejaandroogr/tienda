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
    limpiarFormulario();
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

            <button
              type="button"
              className="admin-primary-button"
              onClick={manejarNuevaCategoria}
            >
              Nueva categoría
            </button>

          </div>

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

          <div className="admin-products-table">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>

                {categorias.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="admin-empty"
                    >
                      No hay categorías registradas.
                    </td>
                  </tr>
                ) : (
                  categorias.map(
                    (categoria) => (
                      <tr
                        key={categoria.id}
                      >

                        <td>
                          {categoria.id}
                        </td>

                        <td>
                          {categoria.nombre}
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

export default AdminCategorias;