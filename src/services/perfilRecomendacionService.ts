import type {
  AtributosPerfil,
  CampoAtributoPerfil,
  CampoUsoPerfil,
  CategoriaPerfil,
  EstadoUso,
  PerfilRecomendacion,
  RespuestaPerfilRecomendacion,
} from '../types/PerfilRecomendacion';

const BASE_URL = 'http://localhost/tienda/backend/productos';

const opciones = (valores: readonly string[]) => valores.map((valor) => ({ valor, etiqueta: valor }));
const nivelesRendimiento = [
  { valor: 'entrada', etiqueta: 'Entrada' },
  { valor: 'media', etiqueta: 'Media' },
  { valor: 'alta', etiqueta: 'Alta' },
];

// Debe coincidir con esquemaPerfilPorCategoria() de backend/productos/perfil_recomendacion.php.
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
    { clave: 'almacenamiento_gb', etiqueta: 'Almacenamiento', tipo: 'numero', unidad: 'GB', maximo: 100000 },
  ],
  'tarjetas graficas': [
    { clave: 'vram_gb', etiqueta: 'VRAM', tipo: 'numero', unidad: 'GB', maximo: 512 },
    { clave: 'rendimiento_gaming', etiqueta: 'Rendimiento gaming', tipo: 'enum', opciones: nivelesRendimiento },
    { clave: 'fabricante', etiqueta: 'Fabricante de la GPU', tipo: 'enum', opciones: [
      { valor: 'nvidia', etiqueta: 'NVIDIA' },
      { valor: 'amd', etiqueta: 'AMD' },
      { valor: 'intel', etiqueta: 'Intel' },
    ] },
  ],
  procesadores: [
    { clave: 'nucleos', etiqueta: 'Núcleos', tipo: 'numero', maximo: 1024, entero: true },
    { clave: 'hilos', etiqueta: 'Hilos', tipo: 'numero', maximo: 4096, entero: true },
    { clave: 'rendimiento', etiqueta: 'Rendimiento', tipo: 'enum', opciones: nivelesRendimiento },
  ],
  moviles: [
    { clave: 'ram_gb', etiqueta: 'RAM', tipo: 'numero', unidad: 'GB', maximo: 1024 },
    { clave: 'almacenamiento_gb', etiqueta: 'Almacenamiento', tipo: 'numero', unidad: 'GB', maximo: 100000 },
    { clave: 'autonomia_h', etiqueta: 'Autonomía', tipo: 'numero', paso: 0.1, unidad: 'h', maximo: 1000 },
    { clave: 'resistencia_ip', etiqueta: 'Resistencia IP', tipo: 'texto', placeholder: 'IP68 o IPX4' },
    { clave: 'peso_g', etiqueta: 'Peso', tipo: 'numero', paso: 0.1, unidad: 'g', maximo: 10000 },
    { clave: 'camara_principal_mp', etiqueta: 'Cámara principal', tipo: 'numero', paso: 0.1, unidad: 'MP', maximo: 1000 },
    { clave: 'pantalla_hz', etiqueta: 'Frecuencia de pantalla', tipo: 'numero', unidad: 'Hz', maximo: 1000 },
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
    { clave: 'cancelacion_ruido', etiqueta: 'Cancelación activa de ruido', tipo: 'booleano' },
  ],
  smartwatch: [
    { clave: 'autonomia_dias', etiqueta: 'Autonomía', tipo: 'numero', paso: 0.1, unidad: 'días', maximo: 3650 },
    { clave: 'resistencia_agua_atm', etiqueta: 'Resistencia al agua', tipo: 'numero', paso: 0.1, unidad: 'ATM', maximo: 1000 },
    { clave: 'gps', etiqueta: 'GPS', tipo: 'booleano' },
    { clave: 'compatibilidad', etiqueta: 'Compatibilidad', tipo: 'lista', opciones: opciones(['ios', 'android']) },
    { clave: 'sensores', etiqueta: 'Sensores', tipo: 'lista', opciones: [
      { valor: 'frecuencia_cardiaca', etiqueta: 'Frecuencia cardíaca' },
      { valor: 'spo2', etiqueta: 'Oxígeno en sangre (SpO2)' },
      { valor: 'ecg', etiqueta: 'Electrocardiograma (ECG)' },
      { valor: 'sueno', etiqueta: 'Sueño' },
      { valor: 'temperatura', etiqueta: 'Temperatura' },
    ] },
  ],
  televisores: [
    { clave: 'pantalla_pulgadas', etiqueta: 'Tamaño de pantalla', tipo: 'numero', paso: 0.1, unidad: 'pulgadas', maximo: 200 },
    { clave: 'resolucion', etiqueta: 'Resolución', tipo: 'enum', opciones: opciones(['HD', 'Full HD', '4K', '8K']) },
    { clave: 'pantalla_hz', etiqueta: 'Frecuencia de pantalla', tipo: 'numero', unidad: 'Hz', maximo: 1000 },
    { clave: 'funciones_gaming', etiqueta: 'Funciones gaming', tipo: 'lista', opciones: opciones(['ALLM', 'VRR']) },
    { clave: 'hdr', etiqueta: 'HDR', tipo: 'lista', opciones: opciones(['HDR10', 'HDR10+', 'Dolby Vision', 'HLG']) },
  ],
};

const ETIQUETAS_USO: Record<string, string> = {
  gaming: 'Gaming',
  programacion: 'Programación',
  trabajo: 'Trabajo',
  edicion: 'Edición',
  creacion_3d: 'Creación 3D',
  ia: 'IA',
  fotografia: 'Fotografía',
  viajes: 'Viajes',
  gimnasio: 'Gimnasio',
  musica: 'Música',
  deporte: 'Deporte',
  salud: 'Salud',
  cine_streaming: 'Cine y streaming',
  deportes: 'Deportes',
  movilidad: 'Movilidad',
};

// Debe coincidir con los usos de esquemaPerfilPorCategoria() en el backend.
const usosPorCategoria: Record<CategoriaPerfil, readonly string[]> = {
  portatiles: ['gaming', 'programacion', 'trabajo', 'edicion', 'movilidad'],
  'tarjetas graficas': ['gaming', 'edicion', 'creacion_3d', 'ia'],
  procesadores: ['gaming', 'programacion', 'trabajo', 'edicion'],
  moviles: ['fotografia', 'gaming', 'trabajo', 'viajes'],
  auriculares: ['gimnasio', 'gaming', 'trabajo', 'musica', 'viajes'],
  smartwatch: ['gimnasio', 'deporte', 'salud', 'trabajo'],
  televisores: ['gaming', 'cine_streaming', 'deportes'],
};

export const ESTADOS_USO: readonly { valor: EstadoUso; etiqueta: string }[] = [
  { valor: 'adecuado', etiqueta: 'Adecuado' },
  { valor: 'no_recomendado', etiqueta: 'No adecuado' },
];

export const PERFIL_VACIO: PerfilRecomendacion = { usos: {}, atributos: {} };

export function normalizarCategoriaPerfil(nombre: string): CategoriaPerfil | null {
  const normalizada = nombre.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const categorias = Object.keys(camposPorCategoria) as CategoriaPerfil[];
  return categorias.find((categoria) => categoria === normalizada) ?? null;
}

export function categoriaAdmitePerfil(categoria: string): boolean {
  return normalizarCategoriaPerfil(categoria) !== null;
}

export function obtenerCamposAtributoCategoria(categoria: string): readonly CampoAtributoPerfil[] {
  const clave = normalizarCategoriaPerfil(categoria);
  return clave ? camposPorCategoria[clave] : [];
}

export function obtenerCamposUsoCategoria(categoria: string): readonly CampoUsoPerfil[] {
  const clave = normalizarCategoriaPerfil(categoria);
  return clave
    ? usosPorCategoria[clave].map((uso) => ({ clave: uso, etiqueta: ETIQUETAS_USO[uso] ?? uso }))
    : [];
}

function esObjetoPlano(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/** Devuelve el valor normalizado si es válido para el campo, o undefined si no lo es. */
function valorAtributoValido(campo: CampoAtributoPerfil, valor: unknown): unknown {
  if (valor === null || valor === undefined || valor === '') return undefined;

  if (campo.tipo === 'texto') {
    // Sin recortar: permite escribir espacios entre palabras; el backend recorta al guardar.
    return typeof valor === 'string' && valor.trim() !== '' && valor.length <= 120 ? valor : undefined;
  }
  if (campo.tipo === 'numero') {
    return typeof valor === 'number' &&
      Number.isFinite(valor) &&
      valor > 0 &&
      (campo.maximo === undefined || valor <= campo.maximo) &&
      (!campo.entero || Number.isInteger(valor))
      ? valor
      : undefined;
  }
  if (campo.tipo === 'booleano') {
    return typeof valor === 'boolean' ? valor : undefined;
  }
  if (campo.tipo === 'enum') {
    return typeof valor === 'string' && campo.opciones.some((opcion) => opcion.valor === valor) ? valor : undefined;
  }
  return Array.isArray(valor) &&
    valor.length > 0 &&
    valor.every((elemento) => typeof elemento === 'string' && campo.opciones.some((opcion) => opcion.valor === elemento))
    ? [...new Set(valor)]
    : undefined;
}

/** Atributos conocidos y válidos de la categoría, para mostrarlos en el formulario. */
export function filtrarAtributosPerfil(atributos: unknown, categoria: string): AtributosPerfil {
  if (!esObjetoPlano(atributos)) return {};

  const resultado: Record<string, unknown> = {};

  for (const campo of obtenerCamposAtributoCategoria(categoria)) {
    const valor = valorAtributoValido(campo, atributos[campo.clave]);
    if (valor !== undefined) resultado[campo.clave] = valor;
  }

  return resultado as AtributosPerfil;
}

/** Usos conocidos de la categoría con un estado válido, para mostrarlos en el formulario. */
export function filtrarUsosPerfil(usos: unknown, categoria: string): Record<string, EstadoUso> {
  if (!esObjetoPlano(usos)) return {};

  const resultado: Record<string, EstadoUso> = {};

  for (const { clave } of obtenerCamposUsoCategoria(categoria)) {
    const estado = usos[clave];
    if (ESTADOS_USO.some((opcion) => opcion.valor === estado)) resultado[clave] = estado as EstadoUso;
  }

  return resultado;
}

/**
 * Cambia un único atributo y conserva el resto del perfil tal como se cargó.
 * Un valor vacío o no válido elimina la clave (dato desconocido).
 */
export function aplicarCambioAtributo(
  perfil: PerfilRecomendacion,
  campo: CampoAtributoPerfil,
  valor: unknown,
): PerfilRecomendacion {
  const atributos = { ...perfil.atributos };
  const valido = valorAtributoValido(campo, valor);

  if (valido === undefined) {
    delete atributos[campo.clave];
  } else {
    atributos[campo.clave] = valido;
  }

  return { ...perfil, atributos };
}

/** Cambia un único uso; undefined lo deja como desconocido. */
export function aplicarCambioUso(
  perfil: PerfilRecomendacion,
  clave: string,
  estado: EstadoUso | undefined,
): PerfilRecomendacion {
  const usos = { ...perfil.usos };

  if (estado === undefined) {
    delete usos[clave];
  } else {
    usos[clave] = estado;
  }

  return { ...perfil, usos };
}

export type EstadoCargaPerfil = 'listo' | 'cargando' | 'error';

/**
 * Perfil que debe enviarse al guardar el producto, o undefined si no debe
 * enviarse: categoría sin esquema IA, o perfil existente sin cargar. Sin
 * perfil_ia el backend no modifica el perfil guardado.
 */
export function crearPayloadPerfil(
  perfil: PerfilRecomendacion,
  categoria: string,
  estadoCarga: EstadoCargaPerfil,
): PerfilRecomendacion | undefined {
  if (estadoCarga !== 'listo' || !categoriaAdmitePerfil(categoria)) return undefined;

  return { usos: { ...perfil.usos }, atributos: { ...perfil.atributos } };
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

  const usos = datos.perfil_ia?.usos;
  const atributos = datos.perfil_ia?.atributos;
  if (!esObjetoPlano(usos) || !esObjetoPlano(atributos)) {
    throw new Error('El perfil de recomendaciones recibido no tiene un formato válido');
  }

  // Se conserva el perfil completo: el formulario solo modifica las claves que se editan.
  return { ...datos, perfil_ia: { usos: { ...usos }, atributos: { ...atributos } } };
}
