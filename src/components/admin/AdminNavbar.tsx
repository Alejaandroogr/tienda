import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ArrowLeft, Boxes, ChartNoAxesCombined, Menu, Package, ShoppingCart, Users, Cpu } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

const links = [
  { to: '/admin', label: 'Dashboard', icon: ChartNoAxesCombined, end: true },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/categorias', label: 'Categorías', icon: Boxes },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
];

function AdminNavbar() {
  const { usuario } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const navLinks = (closeMenu?: () => void) => links.map(({ to, label, icon: Icon, end }) => (
    <NavLink key={to} to={to} end={end} onClick={closeMenu} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
      <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
    </NavLink>
  ));

  return (
    <>
      <aside className="admin-sidebar" aria-label="Navegación de administración">
        <Link to="/" className="admin-sidebar-brand"><span><Cpu size={19} /></span> TECHSTORE</Link>
        <p className="admin-sidebar-caption">GESTIÓN DE TIENDA</p>
        <nav className="admin-sidebar-links">{navLinks()}</nav>
        <div className="admin-sidebar-bottom">
          {usuario && <div className="admin-sidebar-user"><span className="admin-sidebar-avatar">{usuario.nombre.slice(0, 1).toUpperCase()}</span><span><strong>{usuario.nombre}</strong><small>Administrador</small></span></div>}
          <Link to="/" className="admin-back-store"><ArrowLeft size={16} /> Volver a la tienda</Link>
        </div>
      </aside>
      <header className="admin-mobile-header">
        <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
          <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Abrir navegación del administrador"><Menu /></Button>} />
          <SheetContent side="left" className="admin-mobile-sheet">
            <SheetHeader><SheetTitle>TECHSTORE Admin</SheetTitle><SheetDescription>Gestión de la tienda</SheetDescription></SheetHeader>
            <nav className="admin-sidebar-links">{navLinks(() => setMenuAbierto(false))}</nav>
            <Link to="/" onClick={() => setMenuAbierto(false)} className="admin-back-store"><ArrowLeft size={16} /> Volver a la tienda</Link>
          </SheetContent>
        </Sheet>
        <span>Administración</span>
        <Link to="/" aria-label="Volver a la tienda"><Cpu size={19} /></Link>
      </header>
    </>
  );
}

export default AdminNavbar;
