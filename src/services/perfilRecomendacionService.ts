import type {
  AtributosPerfil,
  CampoAtributoPerfil,
  CategoriaPerfil,
  PerfilRecomendacion,
  RespuestaPerfilRecomendacion,
} from '../types/PerfilRecomendacion';

const BASE_URL = 'http://localhost/tienda/backend/productos';

const opciones = (valores: readonly string[]) => valores.map((valor) => ({ valor, etiqueta: valor }));

const camposPorCategoria: Record<CategoriaPerfil, readonly CampoAtributoPerfil[]> = {
  portatiles: [
    { clave: 'cpu_modelo', etiqueta: 'Modelo de CPU', tipo: 'texto' },
    { clave: 'ram_gb', etiqueta: 'RAM', tipo: 'numero', unidad: 'GB', maximo: 1024 },
    { clave: 'gpu_tipo', etiqueta: 'Tipo de GPU', tipo: 'enum', opciones: opciones(['integrada', 'dedicada']) },
    { clave: 'gpu_modelo', etiqueta: 'Modelo de GPU', tipo: 'texto' },
    { clave: 'peso_kg', etiqueta: 'Peso', tipo: 'numero', paso: 0.01, unidad: 'kg', maximo: 100 },
    { clave: 'autonomia_h', etiqueta: 'Autonomía', tipo: 'numero', paso: 0.1, unidad: 'h', maximo: 1000 },
    { clave: 'pantalla_pulgadas', etiqueta: 'Tamaño de pantalla', tipo: 'numero', paso: 0.1, unidad: 'pulgadas', maximo: 200 },
    { clave: 'pantalla_hz', etiqueta: 'Frecuencia de pantalla', tipo: 'numero', unidad: 'Hz', maximo: 1000 },
  ],
  'tarjetas graficas': [
    { clave: 'vram_gb', etiqueta: 'VRAM', tipo: 'numero', unidad: 'GB', maximo: 512 },
  ],
  procesadores: [
    { clave: 'nucleos', etiqueta: 'Núcleos', tipo: 'numero', maximo: 1024 },
    { clave: 'hilos', etiqueta: 'Hilos', tipo: 'numero', maximo: 4096 },
  ],
  moviles: [
    { clave: 'ram_gb', etiqueta: 'RAM', tipo: 'numero', unidad: 'GB', maximo: 1024 },
    { clave: 'almacenamiento_gb', etiqueta: 'Almacenamiento', tipo: 'numero', unidad: 'GB', maximo: 100000 },
    { clave: 'autonomia_h', etiqueta: 'Autonomía', tipo: 'numero', paso: 0.1, unidad: 'h', maximo: 1000 },
    { clave: 'resistencia_ip', etiqueta: 'Resistencia IP', tipo: 'texto', placeholder: 'IP68 o IPX4' },
    { clave: 'peso_g', etiqueta: 'Peso', tipo: 'numero', paso: 0.1, unidad: 'g', maximo: 10000 },
  ],
  auriculares: [
    { clave: 'conexion', etiqueta: 'Conexión', tipo: 'lista', opciones: opciones(['bluetooth', 'usb_inalambrico', 'jack']) },
    { clave: 'autonomia_h', etiqueta: 'Autonomía de los auriculares', tipo: 'numero', paso: 0.1, unidad: 'h', maximo: 1000 },
    { clave: 'autonomia_estuche_h', etiqueta: 'Autonomía del estuche', tipo: 'numero', paso: 0.1, unidad: 'h', maximo: 5000 },
    { clave: 'resistencia_ip', etiqueta: 'Resistencia IP', tipo: 'texto', placeholder: 'IP57 o IPX4' },
    { clave: 'formato', etiqueta: 'Formato', tipo: 'enum', opciones: [
      { valor: 'in_ear', etiqueta: 'In-ear' },
      { valor: 'on_ear', etiqueta: 'On-ear' },
      { valor: 'over_ear', etiqueta: 'Over-ear' },
    ] },
    { clave: 'microfono', etiqueta: 'Micrófono', tipo: 'booleano' },
    { clave: 'peso_g', etiqueta: 'Peso', tipo: 'numero', paso: 0.1, unidad: 'g', maximo: 10000 },
    { clave: 'latencia_ms', etiqueta: 'Latencia', tipo: 'numero', paso: 0.1, unidad: 'ms', maximo: 10000 },
  ],
  smartwatch: [
    { clave: 'autonomia_dias', etiqueta: 'Autonomía', tipo: 'numero', paso: 0.1, unidad: 'días', maximo: 3650 },
    { clave: 'resistencia_agua_atm', etiqueta: 'Resistencia al agua', tipo: 'numero', paso: 0.1, unidad: 'ATM', maximo: 1000 },
    { clave: 'gps', etiqueta: 'GPS', tipo: 'booleano' },
    { clave: 'compatibilidad', etiqueta: 'Compatibilidad', tipo: 'lista', opciones: opciones(['ios', 'android']) },
  ],
  televisores: [
    { clave: 'pantalla_pulgadas', etiqueta: 'Tamaño de pantalla', tipo: 'numero', paso: 0.1, unidad: 'pulgadas', maximo: 200 },
    { clave: 'resolucion', etiqueta: 'Resolución', tipo: 'enum', opciones: opciones(['HD', 'Full HD', '4K', '8K']) },
    { clave: 'pantalla_hz', etiqueta: 'Frecuencia de pantalla', tipo: 'numero', unidad: 'Hz', maximo: 1000 },
    { clave: 'funciones_gaming', etiqueta: 'Funciones gaming', tipo: 'lista', opciones: opciones(['ALLM', 'VRR']) },
  ],
};

export const PERFIL_VACIO: PerfilRecomendacion = { atributos: {} };

export function normalizarCategoriaPerfil(nombre: string): CategoriaPerfil | null {
  const normalizada = nombre.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const categorias: readonly CategoriaPerfil[] = [
    'portatiles', 'tarjetas graficas', 'procesadores', 'moviles',
    'auriculares', 'smartwatch', 'televisores',
  ];
  return categorias.find((categoria) => categoria === normalizada) ?? null;
}

export function obtenerCamposAtributoCategoria(categoria: string): readonly CampoAtributoPerfil[] {
  const clave = normalizarCategoriaPerfil(categoria);
  return clave ? camposPorCategoria[clave] : [];
}

export function filtrarAtributosPerfil(atributos: unknown, categoria: string): AtributosPerfil {
  if (typeof atributos !== 'object' || atributos === null || Array.isArray(atributos)) return {};

  const valores = atributos as Record<string, unknown>;
  const resultado: Record<string, unknown> = {};

  for (const campo of obtenerCamposAtributoCategoria(categoria)) {
    const valor = valores[campo.clave];
    if (valor === null || valor === undefined || valor === '') continue;

    if (campo.tipo === 'texto' && typeof valor === 'string' && valor.trim() !== '' && valor.length <= 120) {
      resultado[campo.clave] = valor.trim();
    } else if (
      campo.tipo === 'numero' &&
      typeof valor === 'number' &&
      Number.isFinite(valor) &&
      valor > 0 &&
      (campo.maximo === undefined || valor <= campo.maximo)
    ) {
      resultado[campo.clave] = valor;
    } else if (campo.tipo === 'booleano' && typeof valor === 'boolean') {
      resultado[campo.clave] = valor;
    } else if (campo.tipo === 'enum' && typeof valor === 'string' && campo.opciones.some((opcion) => opcion.valor === valor)) {
      resultado[campo.clave] = valor;
    } else if (
      campo.tipo === 'lista' &&
      Array.isArray(valor) &&
      valor.length > 0 &&
      valor.every((elemento) => typeof elemento === 'string' && campo.opciones.some((opcion) => opcion.valor === elemento))
    ) {
      resultado[campo.clave] = [...new Set(valor)];
    }
  }

  return resultado as AtributosPerfil;
}

interface ErrorApi {
  error?: string | { code?: string; message?: string };
}

async function leerRespuesta<T>(respuesta: Response, mensajeFallback: string): Promise<T> {
  const datos = await respuesta.json() as T & ErrorApi;
  if (!respuesta.ok) {
    const error = datos.error;
    const mensaje = typeof error === 'string' ? error : error?.message;
    throw new Error(mensaje || mensajeFallback);
  }
  return datos;
}

export async function obtenerPerfilRecomendacion(productoId: number): Promise<RespuestaPerfilRecomendacion> {
  const respuesta = await fetch(`${BASE_URL}/perfil-ia.php?producto_id=${productoId}`, {
    credentials: 'include',
  });
  const datos = await leerRespuesta<RespuestaPerfilRecomendacion>(
    respuesta,
    'No se pudo cargar el perfil de recomendaciones',
  );

  return {
    ...datos,
    perfil_ia: {
      atributos: filtrarAtributosPerfil(datos.perfil_ia?.atributos, datos.categoria),
    },
  };
}

export function crearPayloadPerfil(perfil: PerfilRecomendacion, categoria: string): PerfilRecomendacion {
  return { atributos: filtrarAtributosPerfil(perfil.atributos, categoria) };
}
