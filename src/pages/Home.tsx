import { useEffect, useState } from 'react';
import type { Producto } from '../types/Producto';
import { obtenerProductos } from '../services/productosService';
import ProductCard from '../components/ProductCard';
import Hero from '../components/Hero';
import SearchBar from '../components/SearchBar';

function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [precioMaximo, setPrecioMaximo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerProductos()
      .then((datos) => {
        setProductos(datos);
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

  const productosFiltrados = productos.filter((producto) => {
    const textoBusqueda = busqueda.toLowerCase();

    const coincideBusqueda =
      producto.nombre.toLowerCase().includes(textoBusqueda) ||
      producto.descripcion.toLowerCase().includes(textoBusqueda) ||
      producto.categoria.toLowerCase().includes(textoBusqueda);

    const coincideCategoria =
      categoriaSeleccionada === '' ||
      producto.categoria === categoriaSeleccionada;

    const coincidePrecio =
      precioMaximo === '' ||
      Number(producto.precio) <= Number(precioMaximo);

    return coincideBusqueda && coincideCategoria && coincidePrecio;
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
        <h1 id="productos">Tienda de ordenadores</h1>

        <SearchBar
          valor={busqueda}
          alBuscar={setBusqueda}
        />

        <div className="filters">
          <select
            value={orden}
            onChange={(evento) => setOrden(evento.target.value)}
          >
            <option value="">Ordenar por</option>
            <option value="precio-asc">
              Precio: menor a mayor
            </option>
            <option value="precio-desc">
              Precio: mayor a menor
            </option>
            <option value="nombre-asc">
              Nombre: A-Z
            </option>
            <option value="nombre-desc">
              Nombre: Z-A
            </option>
          </select>

          <select
            value={categoriaSeleccionada}
            onChange={(evento) =>
              setCategoriaSeleccionada(evento.target.value)
            }
          >
            <option value="">Todas las categorías</option>

            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={precioMaximo}
            onChange={(evento) =>
              setPrecioMaximo(evento.target.value)
            }
            placeholder="Precio máximo"
            min="0"
          />
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