import type { Producto } from './Producto';

export interface SolicitudRecomendaciones {
  consulta: string;
  uso: string;
  presupuesto: number;
}

/** El endpoint construye este texto en PHP a partir de evidencias del producto. */
export type MotivoRecomendacion = string;

export interface ProductoRecomendado {
  producto: Producto;
  reason: MotivoRecomendacion;
}

/** Producto relevante para la consulta cuya idoneidad todavía no está confirmada. */
export type ProductoCandidato = ProductoRecomendado;

export type MensajeSinRecomendaciones =
  | 'No hay productos disponibles en este momento.'
  | 'No hay productos disponibles dentro de ese presupuesto.'
  | 'No encontramos coincidencias claras en el catálogo para esa búsqueda y uso. Prueba con otros términos.'
  | 'No encontramos productos que encajen con lo que buscas dentro de tu presupuesto.'
  | 'Los productos recomendados ya no están disponibles dentro de tu presupuesto. Inténtalo de nuevo.';

export interface RespuestaRecomendacionesConResultados {
  recommendations: ProductoRecomendado[];
  candidates: ProductoCandidato[];
  message?: MensajeSinRecomendaciones;
}

export interface RespuestaRecomendacionesSinResultados {
  recommendations: [];
  candidates: [];
  message: MensajeSinRecomendaciones;
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
