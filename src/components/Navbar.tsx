import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useCarrito } from '../context/useCarrito';
import { useAuth } from '../context/useAuth';

function Navbar() {
  const { carrito } = useCarrito();

  const {
    usuario,
    cerrarSesion,
  } = useAuth();

  const navigate = useNavigate();

  const cantidadProductos =
    carrito.reduce(
      (total, item) =>
        total + item.cantidad,
      0
    );

  const manejarCerrarSesion = async () => {
    try {
      await fetch(
        'http://localhost/tienda/backend/usuarios/logout.php',
        {
          method: 'POST',
          credentials: 'include',
        }
      );
    } catch {
      // Aunque falle la petición,
      // cerramos también la sesión local.
    } finally {
      cerrarSesion();
      navigate('/');
    }
  };

  return (
    <header className="navbar">

      <div className="navbar-container">

        <Link
          to="/"
          className="navbar-logo"
        >
          TECHSTORE
        </Link>

        <nav className="navbar-menu">

          <Link to="/">
            Inicio
          </Link>

          <Link to="/">
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

          {usuario ? (
            <>
              <Link to="/pedidos">
                Mis pedidos
              </Link>

              {usuario.rol === 'admin' && (
                <Link
                  to="/admin"
                  className="navbar-admin-link"
                >
                  Panel de administración
                </Link>
              )}

              <span className="navbar-user">
                Hola, {usuario.nombre}
              </span>

              <button
                type="button"
                className="navbar-logout"
                onClick={manejarCerrarSesion}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link to="/login">
              Iniciar sesión
            </Link>
          )}

        </nav>

      </div>

    </header>
  );
}

export default Navbar;