import { useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Cpu, LoaderCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorRecomendaciones, solicitarRecomendaciones } from '../services/recomendacionesService';
import type {
  RespuestaRecomendaciones,
  SolicitudRecomendaciones,
} from '../types/Recomendaciones';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';

const PRESUPUESTO_MAXIMO = 10_000_000;

function mensajeErrorRecomendaciones(error: unknown): string {
  if (!(error instanceof ErrorRecomendaciones)) {
    return 'No se pudo completar la recomendación. Inténtalo de nuevo.';
  }

  switch (error.code) {
    case 'network_error':
      return 'No se pudo conectar con TechStore. Comprueba tu conexión e inténtalo de nuevo.';
    case 'ollama_unavailable':
    case 'curl_unavailable':
      return 'El asistente local no está disponible en este momento. Inténtalo más tarde.';
    case 'ollama_timeout':
      return 'El asistente está tardando demasiado. Vuelve a intentarlo.';
    case 'catalog_unavailable':
      return 'No se pudo consultar el catálogo. Inténtalo de nuevo más tarde.';
    case 'invalid_model_response':
    case 'invalid_model_evidence':
    case 'invalid_product_id':
      return 'El asistente no pudo generar una recomendación verificable. Inténtalo de nuevo.';
    case 'invalid_ollama_configuration':
    case 'request_encoding_failed':
      return 'El servicio de recomendaciones no está configurado correctamente.';
    case 'http_error':
    case 'invalid_response':
      return error.message;
    default:
      return error.message || 'No se pudo completar la recomendación.';
  }
}

function validarLongitud(campo: string, maximo: number): boolean {
  return Array.from(campo.trim()).length > 0 && Array.from(campo.trim()).length <= maximo;
}

function formatearPrecio(precio: string): string {
  const valor = Number(precio);

  return Number.isFinite(valor)
    ? valor.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
    : `${precio} €`;
}

function TarjetaProductoRecomendado({
  producto,
  reason,
}: RespuestaRecomendaciones['recommendations'][number]) {
  const [imagenNoDisponible, setImagenNoDisponible] = useState(false);
  const rutaProducto = `/productos/${producto.id}`;

  return (
    <li>
      <Card className="recommendation-product-card">
        <Link
          to={rutaProducto}
          className="recommendation-product-visual"
          aria-label={`Ver ${producto.nombre}`}
        >
          {producto.imagen && !imagenNoDisponible ? (
            <img
              src={producto.imagen}
              alt={producto.nombre}
              loading="lazy"
              decoding="async"
              onError={() => setImagenNoDisponible(true)}
            />
          ) : (
            <div className="store-product-placeholder">
              <Cpu size={34} strokeWidth={1.2} aria-hidden="true" />
              <span>Imagen próximamente</span>
            </div>
          )}
        </Link>
        <div className="recommendation-product-info">
          <Badge variant="secondary">{producto.categoria}</Badge>
          <Badge variant={producto.stock > 0 ? 'secondary' : 'destructive'}>
            {producto.stock > 0 ? `${producto.stock} disponibles` : 'Sin stock'}
          </Badge>
          <Link to={rutaProducto} className="recommendation-product-name">
            {producto.nombre}
          </Link>
          <strong className="recommendation-product-price">
            {formatearPrecio(producto.precio)}
          </strong>
          <p className="recommendation-product-reason">{reason}</p>
          <Button
            className="recommendation-product-action"
            render={<Link to={rutaProducto} />}
          >
            Ver producto <ArrowUpRight size={15} aria-hidden="true" />
          </Button>
        </div>
      </Card>
    </li>
  );
}

function RecommendationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const envioEnCursoRef = useRef(false);
  const [consulta, setConsulta] = useState('');
  const [uso, setUso] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [respuesta, setRespuesta] = useState<RespuestaRecomendaciones | null>(null);
  const [error, setError] = useState('');

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    if (envioEnCursoRef.current) {
      return;
    }

    const formulario = formRef.current;
    const presupuestoInput = formulario?.elements.namedItem(
      'presupuesto',
    ) as HTMLInputElement | null;

    if (!formulario || !presupuestoInput) {
      return;
    }

    const consultaLimpia = consulta.trim();
    const usoLimpio = uso.trim();

    if (!validarLongitud(consultaLimpia, 120)) {
      setError('Describe qué producto buscas (máximo 120 caracteres).');
      setRespuesta(null);
      return;
    }

    if (!validarLongitud(usoLimpio, 300)) {
      setError('Describe para qué lo necesitas (máximo 300 caracteres).');
      setRespuesta(null);
      return;
    }

    const valorPresupuesto = presupuestoInput.valueAsNumber;

    if (
      !presupuestoInput.validity.valid ||
      !Number.isFinite(valorPresupuesto) ||
      valorPresupuesto <= 0 ||
      valorPresupuesto > PRESUPUESTO_MAXIMO ||
      Math.abs(valorPresupuesto * 100 - Math.round(valorPresupuesto * 100)) > 1e-7
    ) {
      setError('Indica un presupuesto mayor que 0, con hasta dos decimales y no superior a 10 000 000 €.');
      setRespuesta(null);
      presupuestoInput.focus();
      return;
    }

    const solicitud: SolicitudRecomendaciones = {
      consulta: consultaLimpia,
      uso: usoLimpio,
      presupuesto: valorPresupuesto,
    };

    envioEnCursoRef.current = true;
    setCargando(true);
    setError('');
    setRespuesta(null);

    try {
      setRespuesta(await solicitarRecomendaciones(solicitud));
    } catch (errorSolicitud) {
      setError(mensajeErrorRecomendaciones(errorSolicitud));
    } finally {
      envioEnCursoRef.current = false;
      setCargando(false);
    }
  };

  return (
    <section
      className="recommendation-section"
      aria-labelledby="recommendation-title"
      aria-busy={cargando}
    >
      <Card className="recommendation-card">
        <CardHeader className="recommendation-header">
          <p className="eyebrow">ASISTENTE TECHSTORE</p>
          <CardTitle id="recommendation-title">
            <Sparkles size={19} aria-hidden="true" />
            Encuentra lo que necesitas
          </CardTitle>
          <CardDescription>
            Cuéntanos qué buscas, para qué lo usarás y cuánto quieres invertir.
            Te sugeriremos opciones disponibles del catálogo.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            ref={formRef}
            className="recommendation-form"
            onSubmit={manejarEnvio}
            aria-describedby="recommendation-help"
          >
            <p id="recommendation-help" className="recommendation-help">
              El presupuesto admite hasta dos decimales. Las sugerencias son orientativas.
            </p>

            <div className="recommendation-field recommendation-field-full">
              <label htmlFor="recommendation-query">¿Qué producto buscas?</label>
              <Input
                id="recommendation-query"
                name="consulta"
                type="text"
                value={consulta}
                onChange={(evento) => setConsulta(evento.target.value)}
                placeholder="Por ejemplo, un portátil para edición de vídeo"
                maxLength={120}
                autoComplete="off"
                required
                disabled={cargando}
              />
              <span className="recommendation-character-count">
                {Array.from(consulta).length}/120
              </span>
            </div>

            <div className="recommendation-field recommendation-field-full">
              <label htmlFor="recommendation-use">¿Para qué lo necesitas?</label>
              <Textarea
                id="recommendation-use"
                name="uso"
                value={uso}
                onChange={(evento) => setUso(evento.target.value)}
                placeholder="Cuéntanos qué tareas, actividades o características son importantes"
                maxLength={300}
                rows={3}
                required
                disabled={cargando}
              />
              <span className="recommendation-character-count">
                {Array.from(uso).length}/300
              </span>
            </div>

            <div className="recommendation-field recommendation-budget-field">
              <label htmlFor="recommendation-budget">Presupuesto máximo (€)</label>
              <Input
                id="recommendation-budget"
                name="presupuesto"
                type="number"
                value={presupuesto}
                onChange={(evento) => setPresupuesto(evento.target.value)}
                placeholder="Por ejemplo, 1200"
                min="0.01"
                max={PRESUPUESTO_MAXIMO}
                step="0.01"
                inputMode="decimal"
                required
                disabled={cargando}
              />
            </div>

            <div className="recommendation-submit">
              <Button type="submit" size="lg" disabled={cargando}>
                {cargando ? (
                  <>
                    <LoaderCircle size={16} className="recommendation-spinner" aria-hidden="true" />
                    Buscando recomendaciones…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} aria-hidden="true" />
                    Recomendar productos
                  </>
                )}
              </Button>
            </div>
          </form>

          {cargando && (
            <p className="recommendation-status" role="status" aria-live="polite">
              Consultando el catálogo y el asistente local. Puede tardar unos segundos.
            </p>
          )}

          {error && (
            <p className="recommendation-feedback recommendation-feedback-error" role="alert">
              {error}
            </p>
          )}

          {respuesta && respuesta.recommendations.length === 0 && (
            <p className="recommendation-feedback" role="status" aria-live="polite">
              {respuesta.message}
            </p>
          )}

          {respuesta && respuesta.recommendations.length > 0 && (
            <section className="recommendation-results" aria-labelledby="recommendation-results-title">
              <h3 id="recommendation-results-title">Recomendado para ti</h3>
              <ul className="recommendation-product-list">
                {respuesta.recommendations.map((recomendacion) => (
                  <TarjetaProductoRecomendado
                    key={recomendacion.producto.id}
                    {...recomendacion}
                  />
                ))}
              </ul>
            </section>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default RecommendationForm;
