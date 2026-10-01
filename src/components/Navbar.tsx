import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, LogOut, Menu, Package, ShoppingBag, UserRound } from 'lucide-react';
import { useCarrito } from '../context/useCarrito';
import { useAuth } from '../context/useAuth';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { toast } from 'sonner';

function Navbar() {
  const { carrito } = useCarrito();
  const { usuario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const cantidadProductos = carrito.reduce((total, item) => total + item.cantidad, 0);

  const manejarCerrarSesion = async () => {
    try {
      await fetch('http://localhost/tienda/backend/usuarios/logout.php', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // La sesión local también se cierra si la petición no está disponible.
    } finally {
      cerrarSesion();
      toast.info('Sesión cerrada correctamente');
      setMenuAbierto(false);
      navigate('/');
    }
  };

  const cerrarMenu = () => setMenuAbierto(false);
  const enlacesCuenta = usuario ? (
    <>
      <Link className="store-nav-link" to="/pedidos"><Package size={17} /> Mis pedidos</Link>
      {usuario.rol === 'admin' && <Link className="store-nav-link" to="/admin"><Cpu size={17} /> Administración</Link>}
      <span className="store-user"><UserRound size={17} /> Hola, {usuario.nombre}</span>
      <Button variant="ghost" onClick={manejarCerrarSesion}><LogOut size={16} /> Cerrar sesión</Button>
    </>
  ) : <Link className="store-nav-link" to="/login"><UserRound size={17} /> Iniciar sesión</Link>;

  return (
    <header className="navbar store-navbar">
      <div className="navbar-container store-navbar-container">
        <Link to="/" className="navbar-logo store-logo" aria-label="Techstore, inicio">
          <span className="store-logo-mark"><Cpu size={20} /></span>
          <span>TECH<span>STORE</span></span>
        </Link>
        <nav className="store-primary-nav" aria-label="Navegación principal">
          <Link to="/">Inicio</Link>
          <Link to="/#productos">Productos</Link>
        </nav>
        <div className="store-nav-actions">
          <div className="store-desktop-account">{enlacesCuenta}</div>
          <Button variant="outline" className="store-cart-link" onClick={() => navigate('/carrito')} aria-label={`Carrito, ${cantidadProductos} productos`}>
            <ShoppingBag size={17} /> <span className="store-cart-label">Carrito</span>
            <span className="cart-count">{cantidadProductos}</span>
          </Button>
          <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
            <SheetTrigger render={<Button variant="outline" size="icon" className="store-menu-trigger" aria-label="Abrir menú"><Menu /></Button>} />
            <SheetContent side="right" className="store-mobile-sheet">
              <SheetHeader>
                <SheetTitle>TECHSTORE</SheetTitle>
                <SheetDescription>Todo para tu setup, en un solo lugar.</SheetDescription>
              </SheetHeader>
              <nav className="store-mobile-nav" aria-label="Navegación móvil">
                <Link to="/" onClick={cerrarMenu}>Inicio <ArrowRight size={16} /></Link>
                <Link to="/#productos" onClick={cerrarMenu}>Productos <ArrowRight size={16} /></Link>
                <Link to="/carrito" onClick={cerrarMenu}>Carrito ({cantidadProductos}) <ArrowRight size={16} /></Link>
                {usuario ? <>
                  <Link to="/pedidos" onClick={cerrarMenu}>Mis pedidos <ArrowRight size={16} /></Link>
                  {usuario.rol === 'admin' && <Link to="/admin" onClick={cerrarMenu}>Panel de administración <ArrowRight size={16} /></Link>}
                  <Button variant="ghost" onClick={manejarCerrarSesion}><LogOut size={16} /> Cerrar sesión</Button>
                </> : <Link to="/login" onClick={cerrarMenu}>Iniciar sesión <ArrowRight size={16} /></Link>}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
