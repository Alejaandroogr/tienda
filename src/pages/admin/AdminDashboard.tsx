import { useEffect, useState } from 'react';

import { useAuth } from '../../context/useAuth';


interface DashboardData {
  usuarios: {
    total: number;
  };

  productos: {
    total: number;
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

        <section className="admin-stats">

          <article className="admin-stat-card">
            <span className="admin-stat-label">
              Usuarios
            </span>

            <strong className="admin-stat-value">
              {datos.usuarios.total}
            </strong>
          </article>

          <article className="admin-stat-card">
            <span className="admin-stat-label">
              Productos
            </span>

            <strong className="admin-stat-value">
              {datos.productos.total}
            </strong>
          </article>

          <article className="admin-stat-card">
            <span className="admin-stat-label">
              Pedidos
            </span>

            <strong className="admin-stat-value">
              {datos.pedidos.total}
            </strong>
          </article>

          <article className="admin-stat-card">
            <span className="admin-stat-label">
              Ventas
            </span>

            <strong className="admin-stat-value">
              {Number(
                datos.ventas.total
              ).toFixed(2)} €
            </strong>
          </article>

        </section>

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

      </div>
    </main>
  );
}

export default AdminDashboard;