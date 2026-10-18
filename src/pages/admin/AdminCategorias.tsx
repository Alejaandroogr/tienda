import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useAuth } from '../../context/useAuth';
import AdminPagination from '../../components/admin/AdminPagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import AdminTable from '../../components/admin/AdminTable';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';

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

  const [categoriaPendienteEliminar, setCategoriaPendienteEliminar] = useState<Categoria | null>(null);

  const [busqueda, setBusqueda] =
    useState('');

  const [paginaActual, setPaginaActual] =
    useState(1);

  useEffect(() => { if (mensaje) toast.success(mensaje); }, [mensaje]);
  useEffect(() => { if (error && !cargando) toast.error(error); }, [error, cargando]);

  const categoriasPorPagina = 8;

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
      setCategoriaPendienteEliminar(null);

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

  const indiceInicio =
    (paginaMostrada - 1) * categoriasPorPagina;
  const indiceFin = indiceInicio + categoriasPorPagina;
  const categoriasPagina = categoriasFiltradas.slice(
    indiceInicio,
    indiceFin
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
      <main className="admin-container">
        <div className="admin-table-skeleton" aria-label="Cargando categorías" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
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

              <Button
                type="button"
                className="admin-primary-button"
                onClick={manejarNuevaCategoria}
              >
                Nueva categoría
              </Button>

            </div>

          </div>

          {/* FILTRO */}

          <div className="admin-categories-filters">

            <Input
              type="text"
              className="admin-categories-search"
              placeholder="Buscar por nombre o ID..."
              value={busqueda}
              onChange={cambiarBusqueda}
            />

          </div>

          {/* FORMULARIO */}

          <Dialog open={mostrarFormulario} onOpenChange={(open) => { if (!open && !guardando) cerrarFormulario(); }}>
            <DialogContent className="admin-edit-dialog admin-category-dialog">
              <DialogHeader><DialogTitle className="sr-only">{categoriaEditando ? 'Editar categoría' : 'Crear categoría'}</DialogTitle></DialogHeader>
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

                <Button
                  type="button"
                  className="admin-close-button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Cerrar formulario"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  ×
                </Button>

              </div>

              <form
                className="admin-form"
                onSubmit={
                  manejarGuardarCategoria
                }
              >

                <div className="admin-form-grid">

                  <div className="form-group admin-form-full">

                    <Label htmlFor="nombreCategoria">
                      Nombre de la categoría
                    </Label>

                    <Input
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

                  <Button
                    type="button"
                    className="admin-secondary-button"
                    onClick={cerrarFormulario}
                    disabled={guardando}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    className="admin-primary-button"
                    disabled={guardando}
                  >
                    {guardando
                      ? 'Guardando...'
                      : categoriaEditando
                        ? 'Guardar cambios'
                        : 'Crear categoría'}
                  </Button>

                </div>

              </form>

            </div>
            </DialogContent>
          </Dialog>

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

                <AdminTable className="admin-data-table">

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
                            <Badge variant="secondary" className="category-name-badge">{categoria.nombre}</Badge>
                          </td>

                          <td>

                            <div className="admin-product-actions">

                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() =>
                                  manejarEditarCategoria(
                                    categoria
                                  )
                                }
                                >
                                  Editar
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                type="button"
                                onClick={() =>
                                    setCategoriaPendienteEliminar(categoria)
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
                              </Button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </AdminTable>

              </div>

              {/* PAGINACIÓN */}

              <AdminPagination
                paginaActual={paginaMostrada}
                totalPaginas={totalPaginas}
                alCambiarPagina={setPaginaActual}
                ariaLabel="Paginación de categorías"
              />

            </>

          )}

        </section>

      </div>

      <AlertDialog open={Boolean(categoriaPendienteEliminar)} onOpenChange={(open) => { if (!open) setCategoriaPendienteEliminar(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta categoría?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará “{categoriaPendienteEliminar?.nombre}”. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={eliminandoId !== null} onClick={() => { if (categoriaPendienteEliminar) void manejarEliminarCategoria(categoriaPendienteEliminar); }}>Eliminar categoría</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </main>
  );
}

export default AdminCategorias;
