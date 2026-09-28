import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/useAuth';

interface DashboardData {
  usuarios: {
    total: number;
  };

  productos: {
    total: number;
    sin_stock: number;
    stock_bajo: number;
  };

  pedidos: {
    total: number;
    pendientes: number;
    procesando: number;
    enviados: number;
    entregados: number;
    cancelados: number;
  };

  ventas: {
    total: string;
  };
}

function AdminDashboard() {
  const { usuario } = useAuth();

  const [datos, setDatos] =
    useState<DashboardData | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const obtenerDashboard = async () => {
      try {
        setCargando(true);
        setError('');

        const respuesta = await fetch(
          'http://localhost/tienda/backend/admin/dashboard.php',
          {
            credentials: 'include',
          }
        );

        const resultado =
          await respuesta.json();

        if (!respuesta.ok) {
          setError(
            resultado.error ||
              'No se han podido obtener las estadísticas'
          );

          return;
        }

        setDatos(resultado);

      } catch {
        setError(
          'No se ha podido conectar con el servidor'
        );
      } finally {
        setCargando(false);
      }
    };

    if (usuario?.rol === 'admin') {
      obtenerDashboard();
    }
  }, [usuario]);

  if (!usuario) {
    return (
      <main>
        <div className="admin-message">
          <h1>Acceso restringido</h1>

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
          <h1>Acceso denegado</h1>

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
            Cargando dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <div className="admin-message admin-error">
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!datos) {
    return null;
  }

  return (
    <main>
      <div className="admin-container">

        {/* CABECERA */}

        <div className="admin-header">
          <div>
            <p className="admin-subtitle">
              ADMINISTRACIÓN
            </p>

            <h1>
              Dashboard
            </h1>

            <p>
              Bienvenido, {usuario.nombre}.
              Aquí tienes un resumen de la tienda.
            </p>
          </div>
        </div>


        {/* ESTADÍSTICAS PRINCIPALES */}

        <section className="admin-stats">

          <Link
            to="/admin/usuarios"
            className="admin-stat-card admin-stat-card-link"
          >
            <span className="admin-stat-label">
              Usuarios
            </span>

            <strong className="admin-stat-value">
              {datos.usuarios.total}
            </strong>

            <span className="admin-stat-action">
              Ver usuarios →
            </span>
          </Link>


          <Link
            to="/admin/productos"
            className="admin-stat-card admin-stat-card-link"
          >
            <span className="admin-stat-label">
              Productos
            </span>

            <strong className="admin-stat-value">
              {datos.productos.total}
            </strong>

            <span className="admin-stat-action">
              Ver productos →
            </span>
          </Link>


          <Link
            to="/admin/pedidos"
            className="admin-stat-card admin-stat-card-link"
          >
            <span className="admin-stat-label">
              Pedidos
            </span>

            <strong className="admin-stat-value">
              {datos.pedidos.total}
            </strong>

            <span className="admin-stat-action">
              Ver pedidos →
            </span>
          </Link>


          <Link
            to="/admin/pedidos"
            className="admin-stat-card admin-stat-card-link"
          >
            <span className="admin-stat-label">
              Ventas
            </span>

            <strong className="admin-stat-value">
              {Number(
                datos.ventas.total
              ).toFixed(2)} €
            </strong>

            <span className="admin-stat-action">
              Ver pedidos →
            </span>
          </Link>

        </section>


        {/* RESUMEN DE PEDIDOS */}

        <section className="admin-orders-summary">

          <div className="admin-section-header">
            <div>
              <p className="admin-section-subtitle">
                ESTADO DE LOS PEDIDOS
              </p>

              <h2>
                Resumen de pedidos
              </h2>
            </div>
          </div>


          <div className="admin-order-stats">

            <div className="admin-order-stat">
              <span>
                Pendientes
              </span>

              <strong>
                {datos.pedidos.pendientes}
              </strong>
            </div>


            <div className="admin-order-stat">
              <span>
                Procesando
              </span>

              <strong>
                {datos.pedidos.procesando}
              </strong>
            </div>


            <div className="admin-order-stat">
              <span>
                Enviados
              </span>

              <strong>
                {datos.pedidos.enviados}
              </strong>
            </div>


            <div className="admin-order-stat">
              <span>
                Entregados
              </span>

              <strong>
                {datos.pedidos.entregados}
              </strong>
            </div>


            <div className="admin-order-stat">
              <span>
                Cancelados
              </span>

              <strong>
                {datos.pedidos.cancelados}
              </strong>
            </div>

          </div>

        </section>


        {/* ALERTAS DE STOCK */}

        <section className="admin-stock-summary">

          <div className="admin-section-header">
            <div>
              <p className="admin-section-subtitle">
                INVENTARIO
              </p>

              <h2>
                Estado del stock
              </h2>
            </div>
          </div>


          <div className="admin-stock-alerts">

            <Link
              to="/admin/productos"
              className="admin-stock-alert admin-stock-alert-link"
            >
              <div className="admin-stock-alert-info">

                <span className="admin-stock-alert-title">
                  Productos sin stock
                </span>

                <span className="admin-stock-alert-description">
                  Productos que actualmente no tienen
                  unidades disponibles.
                </span>

              </div>

              <strong className="admin-stock-alert-value">
                {datos.productos.sin_stock}
              </strong>
            </Link>


            <Link
              to="/admin/productos"
              className="admin-stock-alert admin-stock-alert-link"
            >
              <div className="admin-stock-alert-info">

                <span className="admin-stock-alert-title">
                  Stock bajo
                </span>

                <span className="admin-stock-alert-description">
                  Productos con 10 unidades o menos.
                </span>

              </div>

              <strong className="admin-stock-alert-value">
                {datos.productos.stock_bajo}
              </strong>
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
}

export default AdminDashboard;