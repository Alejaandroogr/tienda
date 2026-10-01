import { Outlet, Navigate } from 'react-router-dom';

import AdminNavbar from './AdminNavbar';
import { useAuth } from '../../context/useAuth';

function AdminLayout() {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-workspace">
      <AdminNavbar />
      <div className="admin-workspace-content"><Outlet /></div>
    </div>
  );
}

export default AdminLayout;
