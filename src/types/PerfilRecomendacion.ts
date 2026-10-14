export type CategoriaPerfil =
  | 'portatiles'
  | 'tarjetas graficas'
  | 'procesadores'
  | 'moviles'
  | 'auriculares'
  | 'smartwatch'
  | 'televisores';

export interface AtributosPortatil {
  cpu_modelo?: string;
  ram_gb?: number;
  gpu_tipo?: 'integrada' | 'dedicada';
  gpu_modelo?: string;
  peso_kg?: number;
  autonomia_h?: number;
  pantalla_pulgadas?: number;
  pantalla_hz?: number;
}

export interface AtributosTarjetaGrafica {
  vram_gb?: number;
}

export interface AtributosProcesador {
  nucleos?: number;
  hilos?: number;
}

export interface AtributosMovil {
  ram_gb?: number;
  almacenamiento_gb?: number;
  autonomia_h?: number;
  resistencia_ip?: string;
  peso_g?: number;
}

export interface AtributosAuriculares {
  conexion?: Array<'bluetooth' | 'usb_inalambrico' | 'jack'>;
  autonomia_h?: number;
  autonomia_estuche_h?: number;
  resistencia_ip?: string;
  formato?: 'in_ear' | 'on_ear' | 'over_ear';
  microfono?: boolean;
  peso_g?: number;
  latencia_ms?: number;
}

export interface AtributosSmartwatch {
  autonomia_dias?: number;
  resistencia_agua_atm?: number;
  gps?: boolean;
  compatibilidad?: Array<'ios' | 'android'>;
}

export interface AtributosTelevisor {
  pantalla_pulgadas?: number;
  resolucion?: 'HD' | 'Full HD' | '4K' | '8K';
  pantalla_hz?: number;
  funciones_gaming?: Array<'ALLM' | 'VRR'>;
}

export type AtributosPerfil =
  | AtributosPortatil
  | AtributosTarjetaGrafica
  | AtributosProcesador
  | AtributosMovil
  | AtributosAuriculares
  | AtributosSmartwatch
  | AtributosTelevisor;

export interface PerfilRecomendacion {
  atributos: AtributosPerfil;
}

export interface RespuestaPerfilRecomendacion {
  producto_id: number;
  categoria_id: number;
  categoria: string;
  perfil_ia: PerfilRecomendacion;
  existe_perfil: boolean;
}

export type CampoAtributoPerfil =
  | { clave: string; etiqueta: string; tipo: 'numero'; paso?: number; maximo?: number; unidad?: string }
  | { clave: string; etiqueta: string; tipo: 'texto'; placeholder?: string }
  | { clave: string; etiqueta: string; tipo: 'enum'; opciones: readonly { valor: string; etiqueta: string }[] }
  | { clave: string; etiqueta: string; tipo: 'booleano' }
  | { clave: string; etiqueta: string; tipo: 'lista'; opciones: readonly { valor: string; etiqueta: string }[] };
