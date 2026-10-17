import type { Producto } from '../types/Producto';
import type {
  CodigoErrorRecomendaciones,
  ProductosDisponibles,
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

const LONGITUD_MAXIMA_MENSAJE = 500;

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

  // Solo se muestran los recomendados: un campo candidates de una versión
  // anterior del backend se ignora.
  if (!valor.recommendations.every(esProductoRecomendado)) {
    return null;
  }

  let message: string | undefined;
  if (valor.message !== undefined) {
    // React muestra el texto escapado; basta con exigir un texto acotado.
    if (
      typeof valor.message !== 'string' ||
      valor.message.trim() === '' ||
      valor.message.length > LONGITUD_MAXIMA_MENSAJE
    ) {
      return null;
    }
    message = valor.message;
  }

  if (valor.recommendations.length === 0 && message === undefined) {
    return null;
  }

  let available: ProductosDisponibles | undefined;
  if (valor.available !== undefined) {
    if (
      !esObjeto(valor.available) ||
      typeof valor.available.categoria !== 'string' ||
      !Array.isArray(valor.available.productos) ||
      !valor.available.productos.every(esProducto)
    ) {
      return null;
    }
    available = {
      categoria: valor.available.categoria,
      productos: valor.available.productos as Producto[],
    };
  }

  let notices: string[] | undefined;
  if (valor.notices !== undefined) {
    if (
      !Array.isArray(valor.notices) ||
      !valor.notices.every(
        (aviso) => typeof aviso === 'string' && aviso.trim() !== '' && aviso.length <= LONGITUD_MAXIMA_MENSAJE
      )
    ) {
      return null;
    }
    notices = valor.notices as string[];
  }

  return {
    recommendations: valor.recommendations as RespuestaRecomendaciones['recommendations'],
    ...(message === undefined ? {} : { message }),
    ...(available === undefined || available.productos.length === 0 ? {} : { available }),
    ...(notices === undefined || notices.length === 0 ? {} : { notices }),
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
