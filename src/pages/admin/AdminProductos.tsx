import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useAuth } from '../../context/useAuth';
import type { Producto } from '../../types/Producto';


interface Categoria {
  id: number;
  nombre: string;
}

function AdminProductos() {
  const { usuario } = useAuth();

  const [productos, setProductos] =
    useState<Producto[]>([]);

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

  const [productoEditando, setProductoEditando] =
    useState<Producto | null>(null);

  const [nombre, setNombre] =
    useState('');

  const [descripcion, setDescripcion] =
    useState('');

  const [precio, setPrecio] =
    useState('');

  const [stock, setStock] =
    useState('');

  const [imagen, setImagen] =
    useState('');

  const [categoriaId, setCategoriaId] =
    useState('');

  const [guardando, setGuardando] =
    useState(false);

  const [eliminandoId, setEliminandoId] =
    useState<number | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError('');

        const [
          respuestaProductos,
          respuestaCategorias,
        ] = await Promise.all([
          fetch(
            'http://localhost/tienda/backend/productos/listar.php'
          ),
          fetch(
            'http://localhost/tienda/backend/categorias/listar.php'
          ),
        ]);

        const datosProductos =
          await respuestaProductos.json();

        const datosCategorias =
          await respuestaCategorias.json();

        if (!respuestaProductos.ok) {
          setError(
            datosProductos.error ||
              'No se han podido obtener los productos'
          );

          return;
        }

        if (!respuestaCategorias.ok) {
          setError(
            datosCategorias.error ||
              'No se han podido obtener las categorías'
          );

          return;
        }

        setProductos(datosProductos);
        setCategorias(datosCategorias);

      } catch {
        setError(
          'No se ha podido conectar con el servidor'
        );
      } finally {
        setCargando(false);
      }
    };

    if (usuario?.rol === 'admin') {
      cargarDatos();
    }

  }, [usuario]);

  const limpiarFormulario = () => {
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setStock('');
    setImagen('');
    setCategoriaId('');
    setMensaje('');
    setError('');
    setProductoEditando(null);
  };

  const manejarNuevoProducto = () => {
    limpiarFormulario();
    setMostrarFormulario(true);
  };

  const manejarEditarProducto = (
    producto: Producto
  ) => {
    setProductoEditando(producto);

    setNombre(producto.nombre);
    setDescripcion(producto.descripcion);
    setPrecio(producto.precio);
    setStock(String(producto.stock));
    setImagen(producto.imagen || '');

    const categoria =
      categorias.find(
        (item) =>
          item.nombre === producto.categoria
      );

    setCategoriaId(
      categoria
        ? String(categoria.id)
        : ''
    );

    setMensaje('');
    setError('');
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    limpiarFormulario();
  };

  const recargarProductos = async () => {
    const respuesta =
      await fetch(
        'http://localhost/tienda/backend/productos/listar.php'
      );

    const datos =
      await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.error ||
          'No se han podido actualizar los productos'
      );
    }

    setProductos(datos);
  };

  const manejarCrearProducto = async (
    evento: FormEvent<HTMLFormElement>
  ) => {
    evento.preventDefault();

    setError('');
    setMensaje('');

    if (
      nombre.trim() === '' ||
      descripcion.trim() === '' ||
      precio === '' ||
      stock === '' ||
      categoriaId === ''
    ) {
      setError(
        'Todos los campos obligatorios deben estar completos'
      );

      return;
    }

    if (
      Number(precio) < 0 ||
      Number(stock) < 0
    ) {
      setError(
        'El precio y el stock no pueden ser negativos'
      );

      return;
    }

    try {
      setGuardando(true);

      const respuesta =
        await fetch(
          'http://localhost/tienda/backend/productos/crear.php',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              nombre: nombre.trim(),
              descripcion: descripcion.trim(),
              precio: Number(precio),
              stock: Number(stock),
              imagen: imagen.trim(),
              categoria_id: Number(categoriaId),
            }),
          }
        );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            'No se ha podido crear el producto'
        );

        return;
      }

      await recargarProductos();

      limpiarFormulario();

      setMensaje(
        datos.mensaje ||
          'Producto creado correctamente'
      );

      setMostrarFormulario(false);

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

  const guardarCambiosProducto = async (
    evento: FormEvent<HTMLFormElement>
  ) => {
    evento.preventDefault();

    setError('');
    setMensaje('');

    if (!productoEditando) {
      return;
    }

    if (
      nombre.trim() === '' ||
      descripcion.trim() === '' ||
      precio === '' ||
      stock === '' ||
      categoriaId === ''
    ) {
      setError(
        'Todos los campos obligatorios deben estar completos'
      );

      return;
    }

    if (
      Number(precio) < 0 ||
      Number(stock) < 0
    ) {
      setError(
        'El precio y el stock no pueden ser negativos'
      );

      return;
    }

    try {
      setGuardando(true);

      const respuesta =
        await fetch(
          'http://localhost/tienda/backend/productos/editar.php',
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              id: productoEditando.id,
              nombre: nombre.trim(),
              descripcion: descripcion.trim(),
              precio: Number(precio),
              stock: Number(stock),
              imagen: imagen.trim(),
              categoria_id: Number(categoriaId),
            }),
          }
        );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            'No se ha podido editar el producto'
        );

        return;
      }

      await recargarProductos();

      setMostrarFormulario(false);
      limpiarFormulario();

      setMensaje(
        datos.mensaje ||
          'Producto actualizado correctamente'
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

  const manejarEliminarProducto = async (
    producto: Producto
  ) => {
    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    setError('');
    setMensaje('');

    try {
      setEliminandoId(producto.id);

      const respuesta =
        await fetch(
          'http://localhost/tienda/backend/productos/eliminar.php',
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              id: producto.id,
            }),
          }
        );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            'No se ha podido eliminar el producto'
        );

        return;
      }

      await recargarProductos();

      setMensaje(
        datos.mensaje ||
          'Producto eliminado correctamente'
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
            Cargando productos...
          </p>
        </div>
      </main>
    );
  }

  if (
    error &&
    productos.length === 0
  ) {
    return (
      <main>
        <div className="admin-message admin-error">
          <p>{error}</p>
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
              Productos
            </h1>

            <p>
              Gestiona los productos de la tienda.
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
                Lista de productos
              </h2>
            </div>

            <button
              type="button"
              className="admin-primary-button"
              onClick={manejarNuevoProducto}
            >
              Nuevo producto
            </button>

          </div>

          {mostrarFormulario && (
            <div className="admin-form-card">

              <div className="admin-form-header">

                <div>
                  <p className="admin-section-subtitle">
                    PRODUCTO
                  </p>

                  <h2>
                    {productoEditando
                      ? 'Editar producto'
                      : 'Nuevo producto'}
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
                  productoEditando
                    ? guardarCambiosProducto
                    : manejarCrearProducto
                }
              >

                <div className="admin-form-grid">

                  <div className="form-group">

                    <label htmlFor="nombre">
                      Nombre
                    </label>

                    <input
                      id="nombre"
                      type="text"
                      value={nombre}
                      onChange={(evento) =>
                        setNombre(
                          evento.target.value
                        )
                      }
                      placeholder="Nombre del producto"
                    />

                  </div>

                  <div className="form-group">

                    <label htmlFor="categoria">
                      Categoría
                    </label>

                    <select
                      id="categoria"
                      value={categoriaId}
                      onChange={(evento) =>
                        setCategoriaId(
                          evento.target.value
                        )
                      }
                    >

                      <option value="">
                        Selecciona una categoría
                      </option>

                      {categorias.map(
                        (categoria) => (
                          <option
                            key={categoria.id}
                            value={categoria.id}
                          >
                            {categoria.nombre}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div className="form-group">

                    <label htmlFor="precio">
                      Precio
                    </label>

                    <input
                      id="precio"
                      type="number"
                      min="0"
                      step="0.01"
                      value={precio}
                      onChange={(evento) =>
                        setPrecio(
                          evento.target.value
                        )
                      }
                      placeholder="0.00"
                    />

                  </div>

                  <div className="form-group">

                    <label htmlFor="stock">
                      Stock
                    </label>

                    <input
                      id="stock"
                      type="number"
                      min="0"
                      step="1"
                      value={stock}
                      onChange={(evento) =>
                        setStock(
                          evento.target.value
                        )
                      }
                      placeholder="0"
                    />

                  </div>

                  <div className="form-group admin-form-full">

                    <label htmlFor="imagen">
                      URL de la imagen
                    </label>

                    <input
                      id="imagen"
                      type="text"
                      value={imagen}
                      onChange={(evento) =>
                        setImagen(
                          evento.target.value
                        )
                      }
                      placeholder="https://..."
                    />

                  </div>

                  <div className="form-group admin-form-full">

                    <label htmlFor="descripcion">
                      Descripción
                    </label>

                    <textarea
                      id="descripcion"
                      value={descripcion}
                      onChange={(evento) =>
                        setDescripcion(
                          evento.target.value
                        )
                      }
                      placeholder="Descripción del producto"
                      rows={5}
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
                      : productoEditando
                        ? 'Guardar cambios'
                        : 'Crear producto'}
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
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>

                {productos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="admin-empty"
                    >
                      No hay productos registrados.
                    </td>
                  </tr>
                ) : (
                  productos.map(
                    (producto) => (
                      <tr
                        key={producto.id}
                      >

                        <td>
                          {producto.id}
                        </td>

                        <td>
                          <div className="admin-product-name">

                            {producto.imagen && (
                              <img
                                src={producto.imagen}
                                alt={producto.nombre}
                              />
                            )}

                            <span>
                              {producto.nombre}
                            </span>

                          </div>
                        </td>

                        <td>
                          {producto.categoria}
                        </td>

                        <td>
                          {Number(
                            producto.precio
                          ).toFixed(2)} €
                        </td>

                        <td>
                          {producto.stock}
                        </td>

                        <td>

                          <div className="admin-product-actions">

                            <button
                              type="button"
                              onClick={() =>
                                manejarEditarProducto(
                                  producto
                                )
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                manejarEliminarProducto(
                                  producto
                                )
                              }
                              disabled={
                                eliminandoId ===
                                producto.id
                              }
                            >
                              {eliminandoId ===
                              producto.id
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

export default AdminProductos;