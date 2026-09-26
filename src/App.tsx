import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CarritoProvider } from './context/CarritoProvider';
import AuthProvider from './context/AuthProvider';

import Carrito from './pages/Carrito';
import ProductoDetalle from './pages/ProductoDetalle';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Checkout from './pages/Checkout';
import Pedidos from './pages/Pedidos';
import PedidoDetalle from './pages/PedidoDetalle';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductos from './pages/admin/AdminProductos';
import AdminCategorias from './pages/admin/AdminCategorias';
import AdminPedidos from './pages/admin/AdminPedidos';
import AdminUsuarios from './pages/admin/AdminUsuarios';

function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <BrowserRouter>
          <Navbar />

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

          <Footer />
        </BrowserRouter>
      </CarritoProvider>
    </AuthProvider>
  );
}

export default App;