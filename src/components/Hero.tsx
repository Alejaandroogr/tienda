import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

function Hero() {
  return (
    <section className="hero store-hero">
      <div className="hero-content store-hero-content">
        <div className="store-hero-copy">
          <p className="hero-subtitle">
            <span /> TECNOLOGÍA PARA LLEGAR MÁS LEJOS
          </p>
          <h1>
            <span className="store-hero-title-line">
              El siguiente nivel
            </span>
            <span className="store-hero-title-line">
              empieza <span>por dentro.</span>
            </span>
          </h1>
          <p className="hero-description">
            Componentes, equipos y accesorios seleccionados para que cada
            proyecto —y cada partida— funcione a su máximo nivel.
          </p>
          <div className="store-hero-actions">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link to="/#productos" />}
            >
              Explorar productos <ArrowRight size={17} />
            </Button>
            <span className="store-hero-note">
              <CheckCircle2 size={16} /> Asesoramiento experto
            </span>
          </div>
          <div className="store-trust-row">
            <span>
              <Truck size={16} /> Envío rápido
            </span>
            <span>
              <ShieldCheck size={16} /> Compra segura
            </span>
            <span>
              <Cpu size={16} /> Marcas top
            </span>
          </div>
        </div>
        <div className="store-hero-art" aria-hidden="true">
          <div className="store-art-chip">
            <Cpu size={96} strokeWidth={1} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
