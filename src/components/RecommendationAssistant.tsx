import { useEffect, useRef, useState } from 'react';
import { Bot, X } from 'lucide-react';
import { Button } from './ui/button';
import RecommendationForm from './RecommendationForm';

function RecommendationAssistant() {
  const [abierto, setAbierto] = useState(false);
  const botonAbrirRef = useRef<HTMLButtonElement>(null);
  const botonCerrarRef = useRef<HTMLButtonElement>(null);
  const seAbrioRef = useRef(false);

  useEffect(() => {
    if (abierto) {
      seAbrioRef.current = true;
      botonCerrarRef.current?.focus();
      return;
    }

    if (seAbrioRef.current) {
      botonAbrirRef.current?.focus();
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto) {
      return;
    }

    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        setAbierto(false);
      }
    };

    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [abierto]);

  return (
    <>
      <div
        id="recommendation-assistant-panel"
        className="recommendation-assistant-panel"
        role="dialog"
        aria-labelledby="recommendation-assistant-heading"
        aria-modal="false"
        hidden={!abierto}
      >
        <div className="recommendation-assistant-panel-heading">
          <div>
            <Bot size={19} aria-hidden="true" />
            <h2 id="recommendation-assistant-heading">Asistente TechStore</h2>
          </div>
          <Button
            ref={botonCerrarRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Cerrar asistente de recomendaciones"
            onClick={() => setAbierto(false)}
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </div>
        <div className="recommendation-assistant-panel-content">
          <RecommendationForm />
        </div>
      </div>

      <Button
        ref={botonAbrirRef}
        type="button"
        className="recommendation-assistant-trigger"
        aria-label={abierto ? 'Cerrar Asistente TechStore' : 'Abrir Asistente TechStore'}
        aria-expanded={abierto}
        aria-controls="recommendation-assistant-panel"
        onClick={() => setAbierto((actual) => !actual)}
      >
        {abierto ? <X aria-hidden="true" /> : <Bot aria-hidden="true" />}
        <span>{abierto ? 'Cerrar asistente' : 'Asistente IA'}</span>
      </Button>
    </>
  );
}

export default RecommendationAssistant;
