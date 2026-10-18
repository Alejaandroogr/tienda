/**
 * Tipos de la solicitud y la respuesta del endpoint del asistente
 * (backend/recomendaciones/recomendar.php). Los nombres de los campos de la
 * respuesta están en inglés porque así los devuelve la API.
 */
import type { Producto } from './Producto';

export interface SolicitudRecomendaciones {
  consulta: string;
  uso: string;
  /** Opcional: sin presupuesto no se limita el precio. */
  presupuesto?: number;
}

/** Motivo basado en los datos verificados del producto (redactado por PHP o por el modelo y validado por PHP). */
export type MotivoRecomendacion = string;

export interface ProductoRecomendado {
  producto: Producto;
  reason: MotivoRecomendacion;
  /** Quién redactó el motivo: el modelo local (verificado por PHP) o PHP. */
  source?: 'ollama' | 'php';
}

/**
 * Productos de la categoría pedida cuando no se reconoce el uso. Nunca son
 * recomendaciones: se muestran aparte y con un aviso.
 */
export interface ProductosDisponibles {
  categoria: string;
  productos: Producto[];
}

interface CamposComunesRespuesta {
  message?: string;
  available?: ProductosDisponibles;
  /** Avisos sobre la consulta, por ejemplo un uso que no aplica a la categoría. */
  notices?: string[];
}

export interface RespuestaRecomendacionesConResultados extends CamposComunesRespuesta {
  recommendations: ProductoRecomendado[];
}

/**
 * Sin recomendaciones, el backend explica por qué (puede incluir el producto
 * más barato de la categoría, por eso el texto no es fijo).
 */
export interface RespuestaRecomendacionesSinResultados extends CamposComunesRespuesta {
  recommendations: [];
  message: string;
}

export type RespuestaRecomendaciones =
  | RespuestaRecomendacionesConResultados
  | RespuestaRecomendacionesSinResultados;

export type CodigoErrorRecomendaciones =
  | 'origin_not_allowed'
  | 'method_not_allowed'
  | 'request_too_large'
  | 'invalid_json'
  | 'invalid_request'
  | 'invalid_budget'
  | 'catalog_unavailable'
  | 'invalid_ollama_configuration'
  | 'request_encoding_failed'
  | 'curl_unavailable'
  | 'ollama_unavailable'
  | 'ollama_timeout'
  | 'ollama_request_failed'
  | 'invalid_model_response'
  | 'invalid_product_id'
  | 'invalid_model_evidence'
  | 'network_error'
  | 'http_error'
  | 'invalid_response'
  | (string & {});

export interface DetalleErrorRecomendaciones {
  code: CodigoErrorRecomendaciones;
  message: string;
}

export interface RespuestaErrorRecomendaciones {
  error: DetalleErrorRecomendaciones;
}
