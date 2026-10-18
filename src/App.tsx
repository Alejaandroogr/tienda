import './App.css';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CarritoProvider } from './context/CarritoProvider';
import AuthProvider from './context/AuthProvider';

import Carrito from './pages/Carrito';
import ProductoDetalle from './pages/ProductoDetalle';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from './components/ui/sonner';

// Las rutas menos visitadas y todo el panel de administración se cargan bajo
// demanda, para que el código inicial de la tienda sea más ligero.
const Login = lazy(() => import('./pages/Login'));
const Registro = lazy(() => import('./pages/Registro'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Pedidos = lazy(() => import('./pages/Pedidos'));
const PedidoDetalle = lazy(() => import('./pages/PedidoDetalle'));

const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProductos = lazy(() => import('./pages/admin/AdminProductos'));
const AdminCategorias = lazy(() => import('./pages/admin/AdminCategorias'));
const AdminPedidos = lazy(() => import('./pages/admin/AdminPedidos'));
const AdminUsuarios = lazy(() => import('./pages/admin/AdminUsuarios'));

function CargandoPagina() {
  return (
    <main className="store-message-page">
      <p role="status">Cargando…</p>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <BrowserRouter>
          <Toaster />
          <Navbar />

          {/* Ocupa el alto sobrante para que el pie quede abajo en las páginas cortas. */}
          <div className="app-content">
          <Suspense fallback={<CargandoPagina />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/productos/:id" element={<ProductoDetalle />} />
              <Route path="/carrito" element={<Carrito />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pedidos" element={<Pedidos />} />
              <Route path="/pedidos/:id" element={<PedidoDetalle />} />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="productos" element={<AdminProductos />} />
                <Route path="categorias" element={<AdminCategorias />} />
                <Route path="pedidos" element={<AdminPedidos />} />
                <Route path="usuarios" element={<AdminUsuarios />} />
              </Route>
            </Routes>
          </Suspense>
          </div>

          <Footer />
        </BrowserRouter>
      </CarritoProvider>
    </AuthProvider>
  );
}

export default App;
