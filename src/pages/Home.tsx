import { useEffect, useState } from 'react';
import type { Producto } from '../types/Producto';
import { obtenerProductos } from '../services/productosService';
import ProductCard from '../components/ProductCard';
import Hero from '../components/Hero';
import SearchBar from '../components/SearchBar';
import { Slider } from '../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const opcionesOrden = [
  {
    label: 'Ordenar por',
    value: null,
  },
  {
    label: 'Precio: menor a mayor',
    value: 'precio-asc',
  },
  {
    label: 'Precio: mayor a menor',
    value: 'precio-desc',
  },
  {
    label: 'Nombre: A-Z',
    value: 'nombre-asc',
  },
  {
    label: 'Nombre: Z-A',
    value: 'nombre-desc',
  },
];

function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState('todas');

  const [precioMinimo, setPrecioMinimo] = useState(0);
  const [precioMaximo, setPrecioMaximo] = useState(0);

  const [rangoPrecio, setRangoPrecio] =
    useState<[number, number]>([0, 0]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerProductos()
      .then((datos) => {
        setProductos(datos);

        if (datos.length > 0) {
          const precios = datos.map((producto) =>
            Number(producto.precio)
          );

          const precioMinimoCalculado = Math.min(...precios);
          const precioMaximoCalculado = Math.max(...precios);

          setPrecioMinimo(precioMinimoCalculado);
          setPrecioMaximo(precioMaximoCalculado);

          setRangoPrecio([
            precioMinimoCalculado,
            precioMaximoCalculado,
          ]);
        }
      })
      .catch(() => {
        setError('No se han podido cargar los productos');
      })
      .finally(() => {
        setCargando(false);
      });
  }, []);

  if (cargando) {
    return <p>Cargando productos...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  const categorias = Array.from(
    new Set(productos.map((producto) => producto.categoria))
  );

  const opcionesCategorias = [
    {
      label: 'Todas las categorías',
      value: null,
    },
    ...categorias.map((categoria) => ({
      label: categoria,
      value: categoria,
    })),
  ];

  const productosFiltrados = productos.filter((producto) => {
    const textoBusqueda = busqueda.toLowerCase();

    const coincideBusqueda =
      producto.nombre.toLowerCase().includes(textoBusqueda) ||
      producto.descripcion.toLowerCase().includes(textoBusqueda) ||
      producto.categoria.toLowerCase().includes(textoBusqueda);

    const coincideCategoria =
      categoriaSeleccionada === 'todas' ||
      categoriaSeleccionada === '' ||
      producto.categoria === categoriaSeleccionada;

    const precioProducto = Number(producto.precio);

    const coincidePrecio =
      precioProducto >= rangoPrecio[0] &&
      precioProducto <= rangoPrecio[1];

    return (
      coincideBusqueda &&
      coincideCategoria &&
      coincidePrecio
    );
  });

  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    switch (orden) {
      case 'precio-asc':
        return Number(a.precio) - Number(b.precio);

      case 'precio-desc':
        return Number(b.precio) - Number(a.precio);

      case 'nombre-asc':
        return a.nombre.localeCompare(b.nombre);

      case 'nombre-desc':
        return b.nombre.localeCompare(a.nombre);

      default:
        return 0;
    }
  });

  return (
    <>
      <Hero />

      <main>

        <SearchBar
          valor={busqueda}
          alBuscar={setBusqueda}
        />

        <div className="filters">
          {/* ORDENAR */}
          <Select
            items={opcionesOrden}
            value={orden || null}
            onValueChange={(valor) =>
              setOrden(valor ?? '')
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>

                {opcionesOrden.map((opcion) => (
                  <SelectItem
                    key={opcion.value ?? 'ordenar'}
                    value={opcion.value}
                  >
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* CATEGORÍAS */}
          <Select
            items={opcionesCategorias}
            value={
              categoriaSeleccionada === 'todas'
                ? null
                : categoriaSeleccionada
            }
            onValueChange={(valor) =>
              setCategoriaSeleccionada(
                valor ?? 'todas'
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>

                {opcionesCategorias.map((opcion) => (
                  <SelectItem
                    key={opcion.value ?? 'todas'}
                    value={opcion.value}
                  >
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* PRECIO */}
          <div className="price-filter">
            <div className="price-filter-title">
              <span>Rango de precio</span>
            </div>

            <div className="price-filter-values">
              <div className="price-value">
                <span>Mínimo</span>

                <strong>
                  {rangoPrecio[0]} €
                </strong>
              </div>

              <span className="price-separator">
                —
              </span>

              <div className="price-value">
                <span>Máximo</span>

                <strong>
                  {rangoPrecio[1]} €
                </strong>
              </div>
            </div>

            <div className="price-slider">
              <Slider
                value={rangoPrecio}
                min={precioMinimo}
                max={precioMaximo}
                step={10}
                onValueChange={(valor) => {
                  if (Array.isArray(valor)) {
                    setRangoPrecio([
                      valor[0],
                      valor[1],
                    ]);
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="products-grid">
          {productosOrdenados.map((producto) => (
            <ProductCard
              key={producto.id}
              producto={producto}
            />
          ))}
        </div>
      </main>
    </>
  );
}

export default Home;