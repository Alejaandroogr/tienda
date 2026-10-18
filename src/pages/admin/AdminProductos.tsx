import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import { useAuth } from '../../context/useAuth';
import type { Producto } from '../../types/Producto';
import AdminPagination from '../../components/admin/AdminPagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import AdminTable from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { PerfilRecomendacionFields } from '../../components/admin/PerfilRecomendacionFields';
import type { PerfilRecomendacion } from '../../types/PerfilRecomendacion';
import {
  crearPayloadPerfil,
  obtenerPerfilRecomendacion,
  PERFIL_VACIO,
  type EstadoCargaPerfil,
} from '../../services/perfilRecomendacionService';

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

  const [perfilIA, setPerfilIA] = useState<PerfilRecomendacion>(PERFIL_VACIO);

  const [estadoPerfil, setEstadoPerfil] = useState<EstadoCargaPerfil>('listo');

  // Perfil guardado del producto en edición y su categoría, para restaurarlo si
  // el administrador cambia de categoría y vuelve a la original.
  const perfilOriginalRef = useRef<{
    categoriaId: string;
    perfil: PerfilRecomendacion;
    estado: EstadoCargaPerfil;
  } | null>(null);

  // Identifica la última carga de perfil; las respuestas anteriores se descartan.
  const cargaPerfilRef = useRef(0);

  const [guardando, setGuardando] =
    useState(false);

  const [eliminandoId, setEliminandoId] =
    useState<number | null>(null);

  const [productoPendienteEliminar, setProductoPendienteEliminar] = useState<Producto | null>(null);

  const [busqueda, setBusqueda] =
    useState('');

  const [categoriaFiltro, setCategoriaFiltro] =
    useState('');

  const [paginaActual, setPaginaActual] =
    useState(1);

  useEffect(() => { if (mensaje) toast.success(mensaje); }, [mensaje]);
  useEffect(() => {
    if (error && !cargando) toast.error(error);
  }, [error, cargando]);

  const productosPorPagina = 8;

  /*
   * CARGAR PRODUCTOS Y CATEGORÍAS
   */

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

  /*
   * FILTRAR PRODUCTOS
   */

  const productosFiltrados =
    productos.filter((producto) => {
      const coincideNombre =
        producto.nombre
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          );

      const coincideCategoria =
        categoriaFiltro === '' ||
        producto.categoria === categoriaFiltro;

      return (
        coincideNombre &&
        coincideCategoria
      );
    });

  /*
   * PAGINACIÓN
   */

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      productosFiltrados.length /
        productosPorPagina
    )
  );

  const paginaMostrada = Math.min(
    paginaActual,
    totalPaginas
  );

  const indiceInicio =
    (paginaMostrada - 1) * productosPorPagina;

  const indiceFin =
    indiceInicio + productosPorPagina;

  const productosPagina = productosFiltrados.slice(
    indiceInicio,
    indiceFin
  );

  /*
   * LIMPIAR FORMULARIO
   */

  const limpiarFormulario = () => {
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setStock('');
    setImagen('');
    setCategoriaId('');
    setPerfilIA(PERFIL_VACIO);
    setEstadoPerfil('listo');
    perfilOriginalRef.current = null;
    cargaPerfilRef.current += 1;
    setMensaje('');
    setError('');
    setProductoEditando(null);
  };

  /*
   * NUEVO PRODUCTO
   */

  const manejarNuevoProducto = () => {
    limpiarFormulario();
    setMostrarFormulario(true);
  };

  /*
   * EDITAR PRODUCTO
   */

  const manejarEditarProducto = async (
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

    const categoriaProductoId = categoria
      ? String(categoria.id)
      : '';

    setCategoriaId(categoriaProductoId);

    setMensaje('');
    setError('');
    setMostrarFormulario(true);

    await cargarPerfilProducto(producto.id, categoriaProductoId);
  };

  const cargarPerfilProducto = async (productoId: number, categoriaProductoId: string) => {
    const carga = ++cargaPerfilRef.current;
    perfilOriginalRef.current = { categoriaId: categoriaProductoId, perfil: PERFIL_VACIO, estado: 'cargando' };
    setPerfilIA(PERFIL_VACIO);
    setEstadoPerfil('cargando');

    let original: { perfil: PerfilRecomendacion; estado: EstadoCargaPerfil };
    try {
      const respuestaPerfil = await obtenerPerfilRecomendacion(productoId);
      original = {
        perfil: respuestaPerfil.existe_perfil ? respuestaPerfil.perfil_ia : PERFIL_VACIO,
        estado: 'listo',
      };
    } catch (errorPerfil) {
      // Sin perfil cargado no se envía perfil_ia, así que el guardado no lo modifica.
      original = { perfil: PERFIL_VACIO, estado: 'error' };
      if (carga === cargaPerfilRef.current) {
        setError(errorPerfil instanceof Error ? errorPerfil.message : 'No se pudo cargar el perfil IA');
      }
    }

    if (carga !== cargaPerfilRef.current) return;

    perfilOriginalRef.current = { categoriaId: categoriaProductoId, ...original };
    setPerfilIA(original.perfil);
    setEstadoPerfil(original.estado);
  };

  const obtenerMensajeError = (datos: { error?: string | { message?: string } }, alternativa: string) =>
    typeof datos.error === 'string' ? datos.error : datos.error?.message || alternativa;

  const cambiarCategoriaFormulario = (siguienteId: string) => {
    if (siguienteId === categoriaId) return;

    const original = perfilOriginalRef.current;
    if (original && siguienteId === original.categoriaId) {
      // De vuelta a la categoría guardada: se recupera su perfil en vez de vaciarlo.
      setPerfilIA(original.perfil);
      setEstadoPerfil(original.estado);
    } else {
      setPerfilIA(PERFIL_VACIO);
      setEstadoPerfil('listo');
    }

    setCategoriaId(siguienteId);
  };

  const nombreCategoriaFormulario =
    categorias.find((categoria) => String(categoria.id) === categoriaId)?.nombre ?? '';

  /*
   * CERRAR FORMULARIO
   */

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    limpiarFormulario();
  };

  /*
   * RECARGAR PRODUCTOS
   */

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

  /*
   * CREAR PRODUCTO
   */

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

    const precioNumerico = Number(precio);
    const stockNumerico = Number(stock);

    if (
      !Number.isFinite(precioNumerico) ||
      precioNumerico < 0
    ) {
      setError(
        'El precio debe ser un número válido mayor o igual a 0'
      );

      return;
    }

    if (
      !Number.isInteger(stockNumerico) ||
      stockNumerico < 0
    ) {
      setError(
        'El stock debe ser un número entero mayor o igual a 0'
      );

      return;
    }

    try {
      setGuardando(true);

      const perfilPayload = crearPayloadPerfil(perfilIA, nombreCategoriaFormulario, estadoPerfil);
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
              precio: precioNumerico,
              stock: stockNumerico,
              imagen: imagen.trim(),
              categoria_id: Number(categoriaId),
              perfil_ia: perfilPayload,
            }),
          }
        );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          obtenerMensajeError(datos, 'No se ha podido crear el producto')
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

  /*
   * EDITAR PRODUCTO
   */

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

    const precioNumerico = Number(precio);
    const stockNumerico = Number(stock);

    if (
      !Number.isFinite(precioNumerico) ||
      precioNumerico < 0
    ) {
      setError(
        'El precio debe ser un número válido mayor o igual a 0'
      );

      return;
    }

    if (
      !Number.isInteger(stockNumerico) ||
      stockNumerico < 0
    ) {
      setError(
        'El stock debe ser un número entero mayor o igual a 0'
      );

      return;
    }

    try {
      setGuardando(true);

      const perfilPayload = crearPayloadPerfil(perfilIA, nombreCategoriaFormulario, estadoPerfil);
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
              precio: precioNumerico,
              stock: stockNumerico,
              imagen: imagen.trim(),
              categoria_id: Number(categoriaId),
              perfil_ia: perfilPayload,
            }),
          }
        );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          obtenerMensajeError(datos, 'No se ha podido editar el producto')
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

  /*
   * ELIMINAR PRODUCTO
   */

  const manejarEliminarProducto = async (
    producto: Producto
  ) => {
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
      setProductoPendienteEliminar(null);

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
   * CAMBIAR BÚSQUEDA
   */

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
        <div className="admin-table-skeleton" aria-label="Cargando productos" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
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

            <Button
              type="button"
              className="admin-primary-button"
              onClick={manejarNuevoProducto}
            >
              Nuevo producto
            </Button>

          </div>

          {/* FILTROS */}

          <div className="admin-products-filters">

            <Input
              type="text"
              value={busqueda}
              onChange={cambiarBusqueda}
              placeholder="Buscar producto..."
              className="admin-search-input"
            />

            <Select
              value={categoriaFiltro || 'todas'}
              onValueChange={(value) => {
                setCategoriaFiltro(
                  !value || value === 'todas' ? '' : value,
                );
                setPaginaActual(1);
              }}
            >
              <SelectTrigger className="admin-filter-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.nombre}>
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          {/* FORMULARIO */}

      <Dialog open={mostrarFormulario} onOpenChange={(open) => { if (!open && !guardando) cerrarFormulario(); }}>
        <DialogContent className="admin-edit-dialog">
          <DialogHeader><DialogTitle className="sr-only">{productoEditando ? 'Editar producto' : 'Crear producto'}</DialogTitle></DialogHeader>
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
                  productoEditando
                    ? guardarCambiosProducto
                    : manejarCrearProducto
                }
                >

                <div className="admin-form-section-heading">
                  <h3>Datos del producto</h3>
                  <p>Información comercial y de catálogo.</p>
                </div>

                <div className="admin-form-grid">

                  {/* NOMBRE */}

                  <div className="form-group">

                    <Label htmlFor="nombre">
                      Nombre
                    </Label>

                    <Input
                      id="nombre"
                      type="text"
                      value={nombre}
                      onChange={(evento) =>
                        setNombre(
                          evento.target.value
                        )
                      }
                      placeholder="Nombre del producto"
                      required
                    />

                  </div>

                  {/* CATEGORÍA */}

                  <div className="form-group">

                    <Label htmlFor="categoria">
                      Categoría
                    </Label>

                    <Select
                      value={categoriaId || null}
                      onValueChange={(value) => cambiarCategoriaFormulario(value ?? '')}
                      disabled={estadoPerfil === 'cargando'}
                    >
                      <SelectTrigger id="categoria" className="w-full"><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                      <SelectContent>
                        {categorias.map((categoria) => <SelectItem key={categoria.id} value={String(categoria.id)}>{categoria.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* PRECIO */}

                  <div className="form-group">

                    <Label htmlFor="precio">
                      Precio
                    </Label>

                    <Input
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
                      required
                    />

                  </div>

                  {/* STOCK */}

                  <div className="form-group">

                    <Label htmlFor="stock">
                      Stock
                    </Label>

                    <Input
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
                      required
                    />

                  </div>

                  {/* IMAGEN */}

                  <div className="form-group admin-form-full">

                    <Label htmlFor="imagen">
                      URL de la imagen
                    </Label>

                    <Input
                      id="imagen"
                      type="url"
                      value={imagen}
                      onChange={(evento) =>
                        setImagen(
                          evento.target.value
                        )
                      }
                      placeholder="https://..."
                    />

                    {imagen.trim() !== '' && (
                      <div className="admin-image-preview">

                        <p>
                          Vista previa
                        </p>

                        <img
                          src={imagen.trim()}
                          alt="Vista previa del producto"
                          onError={(evento) => {
                            evento.currentTarget.style.display =
                              'none';
                          }}
                          onLoad={(evento) => {
                            evento.currentTarget.style.display =
                              'block';
                          }}
                        />

                      </div>
                    )}

                  </div>

                  {/* DESCRIPCIÓN */}

                  <div className="form-group admin-form-full">

                    <Label htmlFor="descripcion">
                      Descripción
                    </Label>

                    <Textarea
                      id="descripcion"
                      value={descripcion}
                      onChange={(evento) =>
                        setDescripcion(
                          evento.target.value
                        )
                      }
                      placeholder="Descripción del producto"
                      rows={5}
                      required
                    />

                  </div>

                </div>

                {estadoPerfil === 'listo' && (
                  <PerfilRecomendacionFields
                    categoria={nombreCategoriaFormulario}
                    perfil={perfilIA}
                    onChange={setPerfilIA}
                  />
                )}

                {estadoPerfil === 'cargando' && <p role="status">Cargando perfil IA existente…</p>}

                {estadoPerfil === 'error' && productoEditando && (
                  <div className="admin-ai-profile" role="alert">
                    <p>
                      No se pudo cargar el perfil IA de este producto. Si guardas
                      ahora, el perfil guardado no se modificará.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => cargarPerfilProducto(productoEditando.id, perfilOriginalRef.current?.categoriaId ?? categoriaId)}
                      disabled={guardando}
                    >
                      Reintentar carga del perfil
                    </Button>
                  </div>
                )}

                <div className="admin-form-actions">

                  <Button
                    type="button"
                    className="admin-secondary-button"
                    onClick={cerrarFormulario}
                    disabled={guardando || estadoPerfil === 'cargando'}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    className="admin-primary-button"
                    disabled={guardando || estadoPerfil === 'cargando'}
                  >
                    {guardando
                      ? 'Guardando...'
                      : productoEditando
                        ? 'Guardar cambios'
                        : 'Crear producto'}
                  </Button>

                </div>

              </form>

            </div>
        </DialogContent>
      </Dialog>

          {/* TABLA */}

          {productosFiltrados.length === 0 ? (

            <div className="admin-empty">

              <p>
                {busqueda ||
                categoriaFiltro
                  ? 'No se han encontrado productos con estos filtros.'
                  : 'No hay productos registrados.'}
              </p>

            </div>

          ) : (

            <>

              <div className="admin-products-table">

                <AdminTable>

                  <thead>

                    <tr>

                      <th>
                        ID
                      </th>

                      <th>
                        Producto
                      </th>

                      <th>
                        Categoría
                      </th>

                      <th>
                        Precio
                      </th>

                      <th>
                        Stock
                      </th>

                      <th>
                        Acciones
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {productosPagina.map(
                      (producto) => (

                        <tr
                          key={producto.id}
                        >

                          <td>
                            #{producto.id}
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

                              <Badge variant="outline"
                              className={
                                producto.stock === 0
                                  ? 'stock-badge stock-out'
                                  : producto.stock <= 10
                                    ? 'stock-badge stock-low'
                                    : 'stock-badge stock-ok'
                              }
                            >

                              {producto.stock === 0
                                ? 'Sin stock'
                                : producto.stock}

                              </Badge>

                          </td>

                          <td>

                            <div className="admin-product-actions">

                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() =>
                                  manejarEditarProducto(
                                    producto
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
                                  setProductoPendienteEliminar(producto)
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
                ariaLabel="Paginación de productos de administración"
              />

            </>

          )}

        </section>

      </div>

      <AlertDialog open={Boolean(productoPendienteEliminar)} onOpenChange={(open) => { if (!open) setProductoPendienteEliminar(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará “{productoPendienteEliminar?.nombre}” del catálogo. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={eliminandoId !== null} onClick={() => { if (productoPendienteEliminar) void manejarEliminarProducto(productoPendienteEliminar); }}>Eliminar producto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </main>
  );
}

export default AdminProductos;
