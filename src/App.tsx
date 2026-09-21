import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CarritoProvider } from './context/CarritoProvider';

import Carrito from './pages/Carrito';
import ProductoDetalle from './pages/ProductoDetalle';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <CarritoProvider>
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/productos/:id" element={<ProductoDetalle />} />
        <Route path="/carrito" element={<Carrito />} />
      </Routes>

      <Footer />
    </BrowserRouter>
    </CarritoProvider>

  );
}

export default App;