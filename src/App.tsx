import { useEffect, useState } from 'react';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: number;
  imagen: string | null;
  categoria: string;
}

function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost/tienda/backend/productos/listar.php')
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error('Error al obtener los productos');
        }

        return respuesta.json();
      })
      .then((datos: Producto[]) => {
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

  return (
    <main>
      <h1>Tienda de ordenadores</h1>

      {productos.map((producto) => (
        <article key={producto.id}>
          <h2>{producto.nombre}</h2>
          <p>{producto.descripcion}</p>
          <p>{producto.precio} €</p>
          <p>Stock: {producto.stock}</p>
          <p>Categoría: {producto.categoria}</p>
        </article>
      ))}
    </main>
  );
}

export default App;