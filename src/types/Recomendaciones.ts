import type { Producto } from './Producto';

export interface SolicitudRecomendaciones {
  consulta: string;
  uso: string;
  presupuesto: number;
}

/** Motivo basado en los datos verificados del producto (redactado por PHP o por el modelo y validado por PHP). */
export type MotivoRecomendacion = string;

export interface ProductoRecomendado {
  producto: Producto;
  reason: MotivoRecomendacion;
  /** Quién redactó el motivo: el modelo local (verificado por PHP) o PHP. */
  source?: 'ollama' | 'php';
}

export interface RespuestaRecomendacionesConResultados {
  recommendations: ProductoRecomendado[];
  message?: string;
}

/**
 * Sin recomendaciones, el backend explica por qué (puede incluir el producto
 * más barato de la categoría, por eso el texto no es fijo).
 */
export interface RespuestaRecomendacionesSinResultados {
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
