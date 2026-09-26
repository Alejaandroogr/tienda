import { NavLink } from 'react-router-dom';

function AdminNavbar() {
  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-container">

        <div className="admin-navbar-title">
          PANEL DE ADMINISTRACIÓN
        </div>

        <div className="admin-navbar-links">

          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive
                ? 'admin-nav-link active'
                : 'admin-nav-link'
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/productos"
            className={({ isActive }) =>
              isActive
                ? 'admin-nav-link active'
                : 'admin-nav-link'
            }
          >
            Productos
          </NavLink>

          <NavLink
            to="/admin/categorias"
            className={({ isActive }) =>
              isActive
                ? 'admin-nav-link active'
                : 'admin-nav-link'
            }
          >
            Categorías
          </NavLink>

          <NavLink
            to="/admin/pedidos"
            className={({ isActive }) =>
              isActive
                ? 'admin-nav-link active'
                : 'admin-nav-link'
            }
          >
            Pedidos
          </NavLink>

          <NavLink
            to="/admin/usuarios"
            className={({ isActive }) =>
              isActive
                ? 'admin-nav-link active'
                : 'admin-nav-link'
            }
          >
            Usuarios
          </NavLink>

        </div>

      </div>
    </nav>
  );
}

export default AdminNavbar;