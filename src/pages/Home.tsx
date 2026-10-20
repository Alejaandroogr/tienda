import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUpDown,
  PackageSearch,
  SlidersHorizontal,
} from 'lucide-react';
import type { Producto } from '../types/Producto';
import { obtenerProductos } from '../services/productosService';
import ProductCard from '../components/ProductCard';
import CatalogPagination from '../components/CatalogPagination';
import Hero from '../components/Hero';
import RecommendationAssistant from '../components/RecommendationAssistant';
import SearchBar from '../components/SearchBar';
import { Slider } from '../components/ui/slider';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { formatearPrecio } from '../lib/formato';

const productosPorPagina = 9;

const opcionesOrden = [
  { label: 'Recomendados', value: 'recomendados' },
  { label: 'Precio: menor a mayor', value: 'precio-asc' },
  { label: 'Precio: mayor a menor', value: 'precio-desc' },
  { label: 'Nombre: A-Z', value: 'nombre-asc' },
  { label: 'Nombre: Z-A', value: 'nombre-desc' },
];

function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('recomendados');
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState('todas');
  const [precioMinimo, setPrecioMinimo] = useState(0);
  const [precioMaximo, setPrecioMaximo] = useState(0);
  const [rangoPrecio, setRangoPrecio] = useState<[number, number]>([0, 0]);
  const [paginaSeleccionada, setPaginaSeleccionada] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerProductos()
      .then((datos) => {
        setProductos(datos);

        if (datos.length > 0) {
          const precios = datos.map((producto) => Number(producto.precio));
          const minimo = Math.min(...precios);
          const maximo = Math.max(...precios);

          setPrecioMinimo(minimo);
          setPrecioMaximo(maximo);
          setRangoPrecio([minimo, maximo]);
        }
      })
      .catch(() => {
        setError(
          'No se han podido cargar los productos. Comprueba tu conexión e inténtalo de nuevo.',
        );
      })
      .finally(() => setCargando(false));
  }, []);

  const categorias = Array.from(
    new Set(productos.map((producto) => producto.categoria)),
  );

  const productosFiltrados = productos.filter((producto) => {
    const textoBusqueda = busqueda.trim().toLocaleLowerCase();
    const coincideBusqueda =
      producto.nombre.toLocaleLowerCase().includes(textoBusqueda) ||
      producto.descripcion.toLocaleLowerCase().includes(textoBusqueda) ||
      producto.categoria.toLocaleLowerCase().includes(textoBusqueda);
    const coincideCategoria =
      categoriaSeleccionada === 'todas' ||
      producto.categoria === categoriaSeleccionada;
    const precio = Number(producto.precio);
    const coincidePrecio =
      precio >= rangoPrecio[0] && precio <= rangoPrecio[1];

    return coincideBusqueda && coincideCategoria && coincidePrecio;
  });

  const productosOrdenados = [...productosFiltrados].sort((productoA, productoB) => {
    switch (orden) {
      case 'precio-asc':
        return Number(productoA.precio) - Number(productoB.precio);
      case 'precio-desc':
        return Number(productoB.precio) - Number(productoA.precio);
      case 'nombre-asc':
        return productoA.nombre.localeCompare(productoB.nombre);
      case 'nombre-desc':
        return productoB.nombre.localeCompare(productoA.nombre);
      default:
        return 0;
    }
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(productosFiltrados.length / productosPorPagina),
  );
  const paginaActual = Math.min(paginaSeleccionada, totalPaginas);
  const indiceInicio = (paginaActual - 1) * productosPorPagina;
  const indiceFin = indiceInicio + productosPorPagina;
  const productosPagina = productosOrdenados.slice(indiceInicio, indiceFin);

  const reiniciarPagina = () => setPaginaSeleccionada(1);

  const manejarBusqueda = (valor: string) => {
    setBusqueda(valor);
    reiniciarPagina();
  };

  const manejarCategoria = (valor: string | null) => {
    setCategoriaSeleccionada(valor ?? 'todas');
    reiniciarPagina();
  };

  const manejarOrden = (valor: string | null) => {
    setOrden(valor ?? 'recomendados');
    reiniciarPagina();
  };

  const manejarRangoPrecio = (valor: number | readonly number[]) => {
    if (Array.isArray(valor) && valor.length >= 2) {
      setRangoPrecio([valor[0], valor[1]]);
      reiniciarPagina();
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoriaSeleccionada('todas');
    setOrden('recomendados');
    setRangoPrecio([precioMinimo, precioMaximo]);
    reiniciarPagina();
  };

  return (
    <div className="home-page">
      <Hero />
      <main className="store-catalog" id="productos">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">SELECCIÓN TECHSTORE</p>
            <h2>Encuentra tu próximo upgrade</h2>
            <p className="catalog-intro">
              Hardware y tecnología elegidos para rendir de verdad.
            </p>
          </div>
          <span className="catalog-count">
            {cargando
              ? 'Cargando catálogo…'
              : `${productosFiltrados.length} productos`}
          </span>
        </div>

        <SearchBar valor={busqueda} alBuscar={manejarBusqueda} />

        <section
          className="filters store-filters"
          aria-label="Filtros de productos"
        >
          <div className="store-filter-control">
            <label>
              <ArrowUpDown size={15} /> Ordenar
            </label>
            <Select
              items={opcionesOrden}
              value={orden}
              onValueChange={manejarOrden}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {opcionesOrden.map((opcion) => (
                    <SelectItem key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="store-filter-control">
            <label>
              <SlidersHorizontal size={15} /> Categoría
            </label>
            <Select
              items={[
                { label: 'Todas las categorías', value: 'todas' },
                ...categorias.map((categoria) => ({
                  label: categoria,
                  value: categoria,
                })),
              ]}
              value={categoriaSeleccionada}
              onValueChange={manejarCategoria}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="price-filter store-price-filter">
            <div className="price-filter-title">Rango de precio</div>
            <div className="price-filter-values">
              <span>{formatearPrecio(rangoPrecio[0])}</span>
              <span>{formatearPrecio(rangoPrecio[1])}</span>
            </div>
            <Slider
              aria-label="Rango de precio"
              value={rangoPrecio}
              min={precioMinimo}
              max={precioMaximo || 1}
              step={10}
              onValueChange={manejarRangoPrecio}
            />
          </div>
        </section>

        {cargando ? (
          <div
            className="products-grid"
            aria-label="Cargando productos"
            aria-busy="true"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div className="store-product-skeleton" key={index}>
                <div />
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="store-empty-state">
            <PackageSearch size={34} />
            <h3>No se pudo cargar el catálogo</h3>
            <p>{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Volver a intentar
            </Button>
          </div>
        ) : productosFiltrados.length > 0 ? (
          <>
            <div className="products-grid">
              {productosPagina.map((producto) => (
                <div className="store-product-enter" key={producto.id}>
                  <ProductCard producto={producto} />
                </div>
              ))}
            </div>

            <CatalogPagination
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
              onCambiarPagina={setPaginaSeleccionada}
            />
          </>
        ) : (
          <div className="store-empty-state">
            <PackageSearch size={34} />
            <h3>No encontramos productos</h3>
            <p>
              Prueba con otros términos o cambia los filtros de búsqueda.
            </p>
            <Button variant="outline" onClick={limpiarFiltros}>
              Limpiar filtros <ArrowDown size={15} />
            </Button>
          </div>
        )}
      </main>
      <RecommendationAssistant />
    </div>
  );
}

export default Home;
