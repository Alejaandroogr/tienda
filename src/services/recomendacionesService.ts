import type { Producto } from '../types/Producto';
import type {
  CodigoErrorRecomendaciones,
  MensajeSinRecomendaciones,
  RespuestaErrorRecomendaciones,
  RespuestaRecomendaciones,
  SolicitudRecomendaciones,
} from '../types/Recomendaciones';

const API_URL =
  'http://localhost/tienda/backend/recomendaciones/recomendar.php';

export class ErrorRecomendaciones extends Error {
  readonly code: CodigoErrorRecomendaciones;
  readonly status: number | null;

  constructor(
    code: CodigoErrorRecomendaciones,
    message: string,
    status: number | null
  ) {
    super(message);
    this.name = 'ErrorRecomendaciones';
    this.code = code;
    this.status = status;
  }
}

const MENSAJES_SIN_RECOMENDACIONES: readonly MensajeSinRecomendaciones[] = [
  'No hay productos disponibles en este momento.',
  'No hay productos disponibles dentro de ese presupuesto.',
  'No encontramos coincidencias claras en el catálogo para esa búsqueda y uso. Prueba con otros términos.',
  'No encontramos productos que encajen con lo que buscas dentro de tu presupuesto.',
  'Los productos recomendados ya no están disponibles dentro de tu presupuesto. Inténtalo de nuevo.',
];

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esProducto(valor: unknown): valor is Producto {
  if (!esObjeto(valor)) {
    return false;
  }

  return (
    Number.isInteger(valor.id) &&
    typeof valor.nombre === 'string' &&
    typeof valor.descripcion === 'string' &&
    typeof valor.precio === 'string' &&
    Number.isInteger(valor.stock) &&
    (typeof valor.imagen === 'string' || valor.imagen === null) &&
    typeof valor.categoria === 'string'
  );
}

function esProductoRecomendado(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    esProducto(valor.producto) &&
    typeof valor.reason === 'string'
  );
}

function normalizarRespuestaRecomendaciones(
  valor: unknown
): RespuestaRecomendaciones | null {
  if (!esObjeto(valor) || !Array.isArray(valor.recommendations)) {
    return null;
  }

  // Compatibilidad con respuestas antiguas: candidates se normaliza a [].
  const candidates = valor.candidates === undefined ? [] : valor.candidates;
  if (!Array.isArray(candidates)) {
    return null;
  }

  if (
    !valor.recommendations.every(esProductoRecomendado) ||
    !candidates.every(esProductoRecomendado)
  ) {
    return null;
  }

  let message: MensajeSinRecomendaciones | undefined;
  if (valor.message !== undefined) {
    if (
      typeof valor.message !== 'string' ||
      !MENSAJES_SIN_RECOMENDACIONES.includes(
        valor.message as MensajeSinRecomendaciones
      )
    ) {
      return null;
    }
    message = valor.message as MensajeSinRecomendaciones;
  }

  if (
    valor.recommendations.length === 0 &&
    candidates.length === 0 &&
    message === undefined
  ) {
    return null;
  }

  return {
    recommendations: valor.recommendations as RespuestaRecomendaciones['recommendations'],
    candidates: candidates as RespuestaRecomendaciones['candidates'],
    ...(message === undefined ? {} : { message }),
  };
}

function esRespuestaError(
  valor: unknown
): valor is RespuestaErrorRecomendaciones {
  return (
    esObjeto(valor) &&
    esObjeto(valor.error) &&
    typeof valor.error.code === 'string' &&
    typeof valor.error.message === 'string'
  );
}

export async function solicitarRecomendaciones(
  solicitud: SolicitudRecomendaciones
): Promise<RespuestaRecomendaciones> {
  let respuesta: Response;

  try {
    respuesta = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(solicitud),
    });
  } catch {
    throw new ErrorRecomendaciones(
      'network_error',
      'No se ha podido conectar con el servidor de recomendaciones.',
      null
    );
  }

  let datos: unknown;

  try {
    datos = await respuesta.json();
  } catch {
    throw new ErrorRecomendaciones(
      respuesta.ok ? 'invalid_response' : 'http_error',
      respuesta.ok
        ? 'El servidor devolvió una respuesta inválida.'
        : `No se pudo solicitar recomendaciones (HTTP ${respuesta.status}).`,
      respuesta.status
    );
  }

  if (!respuesta.ok) {
    if (esRespuestaError(datos)) {
      throw new ErrorRecomendaciones(
        datos.error.code,
        datos.error.message,
        respuesta.status
      );
    }

    throw new ErrorRecomendaciones(
      'http_error',
      `No se pudo solicitar recomendaciones (HTTP ${respuesta.status}).`,
      respuesta.status
    );
  }

  const respuestaNormalizada = normalizarRespuestaRecomendaciones(datos);
  if (respuestaNormalizada === null) {
    throw new ErrorRecomendaciones(
      'invalid_response',
      'El servidor devolvió una respuesta de recomendaciones inválida.',
      respuesta.status
    );
  }

  return respuestaNormalizada;
}
