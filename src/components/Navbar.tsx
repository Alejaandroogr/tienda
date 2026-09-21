import { Link } from 'react-router-dom';
import { useCarrito } from '../context/useCarrito';

function Navbar() {
  const { carrito } = useCarrito();

  const cantidadProductos = carrito.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          TECHSTORE
        </Link>

        <nav className="navbar-menu">
          <Link to="/">Inicio</Link>

          <Link to="/productos">
            Productos
          </Link>

          <Link to="/carrito">
            Carrito
            {cantidadProductos > 0 && (
              <span className="cart-count">
                {cantidadProductos}
              </span>
            )}
          </Link>

          <Link to="/login">
            Iniciar sesión
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;