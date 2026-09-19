function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">

        <a href="/" className="navbar-logo">
          TECHSTORE
        </a>

        <nav className="navbar-menu">
          <a href="/">Inicio</a>
          <a href="/productos">Productos</a>
          <a href="/carrito">Carrito</a>
          <a href="/login">Iniciar sesión</a>
        </nav>

      </div>
    </header>
  );
}

export default Navbar;