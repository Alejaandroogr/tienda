<?php

declare(strict_types=1);

final class ErrorRespuestaModeloRecomendaciones extends RuntimeException
{
    public function __construct(
        public readonly string $codigo,
        string $mensaje
    ) {
        parent::__construct($mensaje);
    }
}

const RECOMENDACIONES_MAX_POR_NIVEL = 3;

function precioCentimosRecomendaciones(mixed $precio): ?int
{
    if (!is_string($precio) || !preg_match('/\A(\d+)(?:\.(\d{1,2}))?\z/', $precio, $partes)) {
        return null;
    }

    $eurosTexto = ltrim($partes[1], '0');
    $eurosTexto = $eurosTexto === '' ? '0' : $eurosTexto;
    $maxEuros = (string) intdiv(PHP_INT_MAX, 100);

    if (
        strlen($eurosTexto) > strlen($maxEuros) ||
        (strlen($eurosTexto) === strlen($maxEuros) && strcmp($eurosTexto, $maxEuros) > 0)
    ) {
        return null;
    }

    $euros = (int) $eurosTexto;
    $centimos = (int) str_pad($partes[2] ?? '', 2, '0');

    return ($euros * 100) + $centimos;
}

function candidatoCumpleFiltrosDurosRecomendaciones(
    array $producto,
    int $presupuestoCentimos,
    array $categoriaIds
): bool {
    $precioCentimos = precioCentimosRecomendaciones($producto['precio'] ?? null);
    $stock = $producto['stock'] ?? null;
    $categoriaId = $producto['categoria_id'] ?? null;

    return $precioCentimos !== null &&
        $precioCentimos <= $presupuestoCentimos &&
        is_int($stock) && $stock > 0 &&
        is_int($categoriaId) &&
        ($categoriaIds === [] || in_array($categoriaId, $categoriaIds, true));
}

function normalizarTextoIdoneidadRecomendaciones(string $texto): string
{
    $texto = strtr(strtolower($texto), [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
        'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u', 'Ü' => 'u', 'Ñ' => 'n',
    ]);
    $texto = preg_replace('/[^a-z0-9]+/', ' ', $texto);

    return trim($texto ?? '');
}

/**
 * Elimina del texto normalizado los usos negados («no para juegos», «sin jugar»,
 * «no lo quiero para programar»), para que no cuenten como intención.
 */
function eliminarUsosNegadosRecomendaciones(string $textoNormalizado): string
{
    $patron = '/\b(?:no|sin|ni|nada\s+de)\s+' .
        '(?:(?:lo\s+|la\s+)?(?:quiero|necesito|busco|uso|usare|voy\s+a\s+usar|es|sera|me\s+interesa)\s+)?' .
        '(?:(?:usarlo|usarla|usar)\s+)?(?:(?:para|de)\s+)?(?:(?:el|la|los|las|un|una|mi|mis)\s+)?' .
        '[a-z0-9]+(?:\s+(?:ni|o|y)\s+(?:para\s+)?[a-z0-9]+)?/';

    return trim(preg_replace($patron, ' ', $textoNormalizado) ?? $textoNormalizado);
}

function solicitudExigeGpuDedicadaRecomendaciones(string $textoNormalizado): bool
{
    if (preg_match('/\b(?:sin|no\s+(?:quiero|necesito|busco))\s+(?:(?:una|la)\s+)?(?:gpu|grafica|tarjeta\s+grafica)\s+dedicada\b/', $textoNormalizado) === 1) {
        return false;
    }

    return preg_match('/\b(?:con\s+(?:una\s+)?)?(?:gpu|grafica|tarjeta\s+grafica)\s+dedicada\b/', $textoNormalizado) === 1;
}

function detectarIntencionTecnicaRecomendaciones(string $textoNormalizado): ?string
{
    $intenciones = [
        'gaming' => [
            'gaming', 'gamer', 'juego', 'juegos', 'jugar', 'videojuego', 'videojuegos',
            'consola', 'consolas', 'ps5', 'playstation', 'xbox',
        ],
        'programacion' => ['programacion', 'programar', 'programador', 'desarrollo', 'desarrollar', 'codigo'],
        'gimnasio' => ['gym', 'gimnasio', 'entrenamiento', 'entrenar', 'ejercicio'],
    ];
    $textoConLimites = ' ' . eliminarUsosNegadosRecomendaciones($textoNormalizado) . ' ';

    foreach ($intenciones as $intencion => $terminos) {
        foreach ($terminos as $termino) {
            if (strpos($textoConLimites, ' ' . $termino . ' ') !== false) {
                return $intencion;
            }
        }
    }

    return null;
}

/** @return 'affirmative'|'negated'|'ambiguous' */
function solicitudNecesitaComunicacionVozRecomendaciones(string $texto): string
{
    $textoNormalizado = normalizarTextoIdoneidadRecomendaciones($texto);
    $patronNegacion = '/\b(?:sin|no\s+(?:(?:necesito|quiero|busco|requiero|me\s+hace\s+falta|me\s+interesa)(?:\s+usar)?|voy\s+a\s+usar))\s+(?:(?:el|un|una|mi|la)\s+)?(?:microfono|voz|llamadas?|hablar|comunicar(?:me)?|conversar)\b/';
    $negacion = preg_match($patronNegacion, $textoNormalizado) === 1;
    $textoSinNegaciones = preg_replace($patronNegacion, ' ', $textoNormalizado) ?? $textoNormalizado;
    $afirmacion = preg_match(
        '/\bcon\s+(?:(?:el|un|una|mi)\s+)?(?:microfono|voz|chat\s+de\s+voz)\b|\b(?:necesito|quiero|busco|requiero)\s+(?:(?:el|un|una|mi|la)\s+)?(?:microfono|voz|hablar|comunicar(?:me)?|conversar|llamar)\b|\bhablar\s+con\s+(?:(?:mis?|los|las)\s+)?(?:amigos|companeros|equipo|gente)\b|\bpara\s+(?:hacer\s+)?llamadas?\b|\bcomunicacion\s+por\s+voz\b/',
        $textoSinNegaciones
    ) === 1;

    if ($negacion && $afirmacion) {
        return 'ambiguous';
    }
    if ($negacion) {
        return 'negated';
    }
    if ($afirmacion) {
        return 'affirmative';
    }

    return 'ambiguous';
}

/**
 * Señal de texto aprobada: «gaming», «gamer», «7.1» o «envolvente» en el nombre o
 * la descripción, ignorando frases negadas («no apto para gaming», «sin 7.1»).
 * Devuelve el término encontrado o null.
 */
function senalTextoGamingRecomendaciones(string $texto): ?string
{
    $texto = mb_strtolower($texto, 'UTF-8');
    $texto = preg_replace(
        '/\b(?:no|sin|nada\s+de)\s+(?:(?:es|apto|apta|pensado|pensada|recomendado|recomendada|diseñado|diseñada|disenado|valido|válido)\s+)?(?:(?:para|de)\s+)?(?:(?:el|los|sonido)\s+)?(?:gaming|gamer|juegos?|7\.1|envolvente)/u',
        ' ',
        $texto
    ) ?? $texto;

    if (preg_match('/(?<![\w.])(gaming|gamer|7\.1|envolvente)(?!\w|\.\d)/u', $texto, $coincidencia) !== 1) {
        return null;
    }

    return $coincidencia[1];
}

function describirEspecificacionRecomendaciones(string $clave, mixed $valor): ?string
{
    $etiquetas = [
        'cpu_modelo' => 'CPU',
        'ram_gb' => 'RAM',
        'gpu_tipo' => 'Tipo de GPU',
        'gpu_modelo' => 'Modelo de GPU',
        'peso_kg' => 'Peso',
        'autonomia_h' => 'Autonomía',
        'pantalla_pulgadas' => 'Pantalla',
        'pantalla_hz' => 'Frecuencia de pantalla',
        'vram_gb' => 'VRAM',
        'nucleos' => 'Núcleos',
        'hilos' => 'Hilos',
        'almacenamiento_gb' => 'Almacenamiento',
        'resistencia_ip' => 'Resistencia IP',
        'peso_g' => 'Peso',
        'conexion' => 'Conexión',
        'autonomia_estuche_h' => 'Autonomía del estuche',
        'formato' => 'Formato',
        'microfono' => 'Micrófono',
        'latencia_ms' => 'Latencia',
        'autonomia_dias' => 'Autonomía',
        'resistencia_agua_atm' => 'Resistencia al agua',
        'gps' => 'GPS',
        'compatibilidad' => 'Compatibilidad',
        'resolucion' => 'Resolución',
        'funciones_gaming' => 'Funciones gaming',
    ];
    $unidades = [
        'ram_gb' => 'GB',
        'peso_kg' => 'kg',
        'peso_g' => 'g',
        'autonomia_h' => 'h',
        'autonomia_estuche_h' => 'h',
        'pantalla_pulgadas' => 'pulgadas',
        'pantalla_hz' => 'Hz',
        'vram_gb' => 'GB',
        'almacenamiento_gb' => 'GB',
        'latencia_ms' => 'ms',
        'autonomia_dias' => 'días',
        'resistencia_agua_atm' => 'ATM',
    ];

    if (!isset($etiquetas[$clave])) {
        return null;
    }

    if (is_bool($valor)) {
        $valorTexto = $valor ? 'sí' : 'no';
    } elseif (is_array($valor) && array_is_list($valor) && $valor !== [] && count(array_filter($valor, 'is_string')) === count($valor)) {
        $valorTexto = implode(', ', $valor);
    } elseif (is_string($valor) && $valor !== '') {
        $valorTexto = $valor;
    } elseif (is_int($valor) || (is_float($valor) && is_finite($valor))) {
        $valorTexto = (string) $valor;
    } else {
        return null;
    }

    $unidad = $unidades[$clave] ?? '';
    return $etiquetas[$clave] . ': ' . $valorTexto . ($unidad === '' ? '' : ' ' . $unidad);
}

function etiquetaIntencionRecomendaciones(string $intencion): string
{
    return [
        'gaming' => 'jugar',
        'programacion' => 'programar',
        'gimnasio' => 'el gimnasio',
    ][$intencion] ?? $intencion;
}

/** Valor descrito sin su etiqueta («16 GB» en lugar de «RAM: 16 GB»). */
function valorDescritoRecomendaciones(string $clave, mixed $valor): ?string
{
    $descripcion = describirEspecificacionRecomendaciones($clave, $valor);

    return $descripcion === null ? null : substr($descripcion, strpos($descripcion, ': ') + 2);
}

function criterioMinimoRecomendaciones(string $requisito, array $especificaciones, string $clave, float $minimo): array
{
    $valor = $especificaciones[$clave] ?? null;
    $conocido = is_int($valor) || is_float($valor);

    return [
        'requisito' => $requisito,
        'cumple' => $conocido ? $valor >= $minimo : null,
        'valor' => $conocido ? valorDescritoRecomendaciones($clave, $valor) : null,
    ];
}

/**
 * Criterios aprobados por categoría e intención. Cada criterio indica si se
 * cumple (true), no se cumple (false) o falta el dato (null). Devuelve null si
 * la intención no tiene criterios aprobados para la categoría.
 *
 * @return list<array{requisito:string, cumple:?bool, valor:?string}>|null
 */
function criteriosIntencionRecomendaciones(
    string $categoria,
    string $intencion,
    array $especificaciones,
    string $textoProducto,
    string $necesidadVoz
): ?array {
    if ($intencion !== 'gaming') {
        return null;
    }

    switch ($categoria) {
        case 'portatiles':
            $gpu = $especificaciones['gpu_tipo'] ?? null;
            $gpuConocida = $gpu === 'dedicada' || $gpu === 'integrada';
            $modelo = $especificaciones['gpu_modelo'] ?? null;

            return [
                [
                    'requisito' => 'GPU dedicada',
                    'cumple' => $gpuConocida ? $gpu === 'dedicada' : null,
                    'valor' => match (true) {
                        !$gpuConocida => null,
                        $gpu === 'dedicada' => is_string($modelo) && $modelo !== '' ? $modelo : null,
                        default => 'GPU integrada' . (is_string($modelo) && $modelo !== '' ? ' ' . $modelo : ''),
                    },
                ],
                criterioMinimoRecomendaciones('RAM de 16 GB o más', $especificaciones, 'ram_gb', 16),
                criterioMinimoRecomendaciones('pantalla de 120 Hz o más', $especificaciones, 'pantalla_hz', 120),
            ];

        case 'auriculares':
            $conexion = $especificaciones['conexion'] ?? null;
            $conexiones = is_array($conexion) ? $conexion : [];
            $criterios = [[
                'requisito' => 'conexión de baja latencia (2.4 GHz o cable)',
                'cumple' => $conexiones === []
                    ? null
                    : array_intersect($conexiones, ['usb_inalambrico', 'jack']) !== [],
                'valor' => $conexiones === [] ? null : valorDescritoRecomendaciones('conexion', $conexiones),
            ]];

            // Si la consulta niega el micrófono, deja de exigirse.
            if ($necesidadVoz !== 'negated') {
                $microfono = $especificaciones['microfono'] ?? null;
                $criterios[] = [
                    'requisito' => 'micrófono',
                    'cumple' => is_bool($microfono) ? $microfono : null,
                    'valor' => null,
                ];
            }

            $termino = senalTextoGamingRecomendaciones($textoProducto);
            $criterios[] = [
                'requisito' => 'orientación gaming (gaming, 7.1 o sonido envolvente)',
                'cumple' => $termino !== null,
                'valor' => $termino !== null ? 'el producto menciona «' . $termino . '»' : null,
            ];

            return $criterios;

        case 'tarjetas graficas':
            return [criterioMinimoRecomendaciones('VRAM de 8 GB o más', $especificaciones, 'vram_gb', 8)];

        case 'procesadores':
            return [criterioMinimoRecomendaciones('6 núcleos o más', $especificaciones, 'nucleos', 6)];

        case 'moviles':
            return [criterioMinimoRecomendaciones('RAM de 8 GB o más', $especificaciones, 'ram_gb', 8)];

        case 'televisores':
            $funciones = $especificaciones['funciones_gaming'] ?? null;
            $funciones = is_array($funciones) ? $funciones : [];

            return [
                criterioMinimoRecomendaciones('pantalla de 120 Hz o más', $especificaciones, 'pantalla_hz', 120),
                [
                    'requisito' => 'modo de juego ALLM o VRR',
                    'cumple' => $funciones === [] ? null : array_intersect($funciones, ['ALLM', 'VRR']) !== [],
                    'valor' => $funciones === [] ? null : valorDescritoRecomendaciones('funciones_gaming', $funciones),
                ],
            ];
    }

    return null;
}

/**
 * Datos pertinentes que se muestran para intenciones sin criterios aprobados.
 * Informan, pero no puntúan ni confirman.
 *
 * @return list<string>
 */
function clavesPertinentesIntencionRecomendaciones(string $categoria, ?string $intencion): array
{
    $mapa = [
        'portatiles' => ['programacion' => ['cpu_modelo', 'ram_gb']],
        'procesadores' => ['programacion' => ['nucleos', 'hilos']],
        'auriculares' => ['gimnasio' => ['resistencia_ip', 'formato', 'peso_g', 'autonomia_h']],
        'smartwatch' => ['gimnasio' => ['resistencia_agua_atm', 'gps', 'autonomia_dias']],
    ];

    return $intencion === null ? [] : ($mapa[$categoria][$intencion] ?? []);
}

/**
 * Evalúa un producto que ya cumple presupuesto, stock y categoría.
 *
 * - confirmed (recomendado): cumple todos los criterios aprobados, o el
 *   administrador lo valoró como adecuado y ningún dato lo contradice.
 * - candidate (podría servirte): falta algún dato o no cumple algún criterio.
 * - excluded: el administrador lo marcó como no adecuado, un dato contradice un
 *   requisito explícito de la consulta, o (sin categoría pedida) su categoría no
 *   tiene criterios para el uso.
 *
 * @return array{classification:'confirmed'|'candidate'|'excluded', puntuacion:float, reason:string, datos:list<string>}
 */
function evaluarProductoRecomendaciones(
    array $candidato,
    string $consulta,
    string $uso,
    bool $categoriaSolicitada
): array {
    $especificaciones = is_array($candidato['especificaciones'] ?? null) ? $candidato['especificaciones'] : [];
    $usos = is_array($candidato['usos'] ?? null) ? $candidato['usos'] : [];
    $categoria = normalizarTextoIdoneidadRecomendaciones((string) ($candidato['categoria'] ?? ''));
    $textoSolicitud = normalizarTextoIdoneidadRecomendaciones($consulta . ' ' . $uso);
    $textoProducto = (string) ($candidato['nombre'] ?? '') . ' ' . (string) ($candidato['descripcion'] ?? '');
    $intencion = detectarIntencionTecnicaRecomendaciones($textoSolicitud);
    $necesidadVoz = solicitudNecesitaComunicacionVozRecomendaciones($consulta . ' ' . $uso);
    $excluido = static fn (string $motivo): array => [
        'classification' => 'excluded', 'puntuacion' => 0.0, 'reason' => $motivo, 'datos' => [],
    ];

    $valoracionTienda = $intencion !== null ? ($usos[$intencion] ?? null) : null;
    if ($valoracionTienda === 'no_recomendado') {
        return $excluido('La tienda lo ha valorado como no adecuado para ' . etiquetaIntencionRecomendaciones($intencion) . '.');
    }

    // Requisitos explícitos de la consulta: un dato en contra excluye, a favor puntúa.
    $requisitos = [];
    if ($categoria === 'portatiles' && solicitudExigeGpuDedicadaRecomendaciones($textoSolicitud)) {
        if (($especificaciones['gpu_tipo'] ?? null) === 'integrada') {
            return $excluido('Pides GPU dedicada y el producto tiene GPU integrada.');
        }
        if (($especificaciones['gpu_tipo'] ?? null) === 'dedicada') {
            $requisitos[] = 'GPU dedicada, como pides';
        }
    }
    if ($categoria === 'auriculares' && $necesidadVoz === 'affirmative') {
        if (($especificaciones['microfono'] ?? null) === false) {
            return $excluido('Necesitas micrófono y el producto no tiene.');
        }
        if (($especificaciones['microfono'] ?? null) === true) {
            $requisitos[] = 'micrófono, como pides';
        }
    }

    $criterios = $intencion !== null
        ? criteriosIntencionRecomendaciones($categoria, $intencion, $especificaciones, $textoProducto, $necesidadVoz)
        : null;

    if (!$categoriaSolicitada && $criterios === null) {
        return $excluido('');
    }

    $cumplidos = [];
    $incumplidos = [];
    $desconocidos = [];
    $puntuacion = 0.0;
    foreach ($criterios ?? [] as $criterio) {
        if ($criterio['cumple'] === true) {
            $cumplidos[] = $criterio['requisito'] . ($criterio['valor'] !== null ? ' (' . $criterio['valor'] . ')' : '');
            $puntuacion += 1;
        } elseif ($criterio['cumple'] === false) {
            $incumplidos[] = $criterio['requisito'] . ($criterio['valor'] !== null ? ' (tiene ' . $criterio['valor'] . ')' : '');
            $puntuacion -= 1;
        } else {
            $desconocidos[] = $criterio['requisito'];
        }
    }

    $puntuacion += count($requisitos);
    if ($valoracionTienda === 'adecuado') {
        $puntuacion += 1;
    }
    // En portátiles, el texto «gaming» solo ordena; nunca confirma.
    if ($categoria === 'portatiles' && $intencion === 'gaming' && senalTextoGamingRecomendaciones($textoProducto) !== null) {
        $puntuacion += 0.5;
    }

    $pertinentes = [];
    foreach (clavesPertinentesIntencionRecomendaciones($categoria, $intencion) as $clave) {
        $hecho = array_key_exists($clave, $especificaciones)
            ? describirEspecificacionRecomendaciones($clave, $especificaciones[$clave])
            : null;
        if ($hecho !== null) {
            $pertinentes[] = $hecho;
        }
    }

    $cumpleTodos = $criterios !== null && $criterios !== [] && $incumplidos === [] && $desconocidos === [];
    $avaladoPorTienda = $valoracionTienda === 'adecuado' && $incumplidos === [];
    $clasificacion = $cumpleTodos || $avaladoPorTienda ? 'confirmed' : 'candidate';

    $para = $intencion !== null ? ' para ' . etiquetaIntencionRecomendaciones($intencion) : '';
    $frases = [];
    if ($clasificacion === 'confirmed') {
        $frases[] = $cumpleTodos
            ? 'Cumple los criterios' . $para . ': ' . implode('; ', $cumplidos) . '.'
            : 'La tienda lo ha valorado como adecuado' . $para . ' y ningún dato lo contradice.';
        if (!$cumpleTodos && $cumplidos !== []) {
            $frases[] = 'Cumple: ' . implode('; ', $cumplidos) . '.';
        }
        if ($cumpleTodos && $valoracionTienda === 'adecuado') {
            $frases[] = 'Además, la tienda lo ha valorado como adecuado' . $para . '.';
        }
    } else {
        $frases[] = $intencion !== null ? 'Podría servirte' . $para . '.' : 'Coincide con el tipo de producto que buscas.';
        if ($cumplidos !== []) {
            $frases[] = 'Cumple: ' . implode('; ', $cumplidos) . '.';
        }
        if ($incumplidos !== []) {
            $frases[] = 'No cumple: ' . implode('; ', $incumplidos) . '.';
        }
    }
    if ($desconocidos !== []) {
        $frases[] = 'Sin dato registrado: ' . implode('; ', $desconocidos) . '.';
    }
    if ($requisitos !== []) {
        $frases[] = 'Tiene ' . implode(' y ', $requisitos) . '.';
    }
    if ($pertinentes !== []) {
        $frases[] = 'Datos registrados: ' . implode('; ', $pertinentes) . '.';
    }

    $datos = array_merge(
        array_map(static fn (string $c): string => 'cumple ' . $c, $cumplidos),
        array_map(static fn (string $c): string => 'no cumple ' . $c, $incumplidos),
        array_map(static fn (string $c): string => 'sin dato: ' . $c, $desconocidos),
        array_map(static fn (string $c): string => 'tiene ' . $c, $requisitos),
        $pertinentes,
        $valoracionTienda === 'adecuado' ? ['la tienda lo ha valorado como adecuado' . $para] : []
    );

    return [
        'classification' => $clasificacion,
        'puntuacion' => $puntuacion,
        'reason' => implode(' ', $frases),
        'datos' => $datos,
    ];
}

/**
 * Ordena por nivel y puntuación (desempate: precio y luego id) y limita cada nivel.
 *
 * @param list<array{id:int, precio:string, classification:string, puntuacion:float}> $evaluados
 * @return array{confirmed:list<array>, candidate:list<array>}
 */
function agruparPorNivelRecomendaciones(array $evaluados, int $maximoPorNivel = RECOMENDACIONES_MAX_POR_NIVEL): array
{
    $niveles = ['confirmed' => [], 'candidate' => []];

    foreach ($evaluados as $evaluado) {
        if (isset($niveles[$evaluado['classification']])) {
            $niveles[$evaluado['classification']][] = $evaluado;
        }
    }

    foreach ($niveles as &$lista) {
        usort($lista, static fn (array $a, array $b): int =>
            [$b['puntuacion'], precioCentimosRecomendaciones($a['precio']) ?? PHP_INT_MAX, $a['id']] <=>
            [$a['puntuacion'], precioCentimosRecomendaciones($b['precio']) ?? PHP_INT_MAX, $b['id']]);
        $lista = array_slice($lista, 0, $maximoPorNivel);
    }
    unset($lista);

    return $niveles;
}

/**
 * Valida la respuesta de Ollama: solo puede reordenar los productos recibidos y
 * redactar explicaciones. Devuelve [id => explicación|null] en el orden propuesto;
 * una explicación que menciona datos no verificados se sustituye por null.
 *
 * @param array<string, array{nombre:string, categoria:string, datos:list<string>, reason:string}> $productos
 * @return array<int, ?string>
 */
function validarRespuestaModeloRecomendaciones(mixed $respuesta, array $productos): array
{
    if (
        !is_array($respuesta) ||
        array_keys($respuesta) !== ['orden'] ||
        !is_array($respuesta['orden']) ||
        !array_is_list($respuesta['orden'])
    ) {
        throw new ErrorRespuestaModeloRecomendaciones(
            'invalid_model_response',
            'El servicio local devolvió una respuesta inválida'
        );
    }

    $resultado = [];
    foreach ($respuesta['orden'] as $elemento) {
        $id = is_array($elemento) ? ($elemento['id'] ?? null) : null;

        if (!is_int($id) || !isset($productos[(string) $id])) {
            throw new ErrorRespuestaModeloRecomendaciones(
                'invalid_product_id',
                'El servicio local devolvió un producto que no se le había pasado'
            );
        }
        if (array_key_exists($id, $resultado)) {
            throw new ErrorRespuestaModeloRecomendaciones(
                'invalid_model_response',
                'El servicio local devolvió un producto repetido'
            );
        }

        $explicacion = $elemento['explicacion'] ?? null;
        $resultado[$id] = is_string($explicacion) &&
            explicacionModeloEsVerificableRecomendaciones($explicacion, $productos[(string) $id])
            ? trim($explicacion)
            : null;
    }

    // Un mismo texto para productos distintos es genérico, no una explicación de cada uno.
    $repeticiones = array_count_values(array_map(
        'normalizarTextoIdoneidadRecomendaciones',
        array_filter($resultado, 'is_string')
    ));
    foreach ($resultado as $id => $explicacion) {
        if (is_string($explicacion) && $repeticiones[normalizarTextoIdoneidadRecomendaciones($explicacion)] > 1) {
            $resultado[$id] = null;
        }
    }

    return $resultado;
}

/**
 * Una explicación es aceptable si es breve, sin enlaces ni HTML, y si cada cifra
 * y cada término técnico que menciona aparece en los datos verificados del producto.
 */
function explicacionModeloEsVerificableRecomendaciones(string $explicacion, array $producto): bool
{
    $explicacion = trim($explicacion);
    $longitud = mb_strlen($explicacion, 'UTF-8');

    if ($longitud < 20 || $longitud > 400 || preg_match('/[<>]|https?:|www\./i', $explicacion) === 1) {
        return false;
    }

    $permitidoOriginal = implode(' ', array_merge(
        [(string) ($producto['nombre'] ?? ''), (string) ($producto['categoria'] ?? ''), (string) ($producto['reason'] ?? '')],
        $producto['datos'] ?? []
    ));
    $permitido = normalizarTextoIdoneidadRecomendaciones($permitidoOriginal);
    $permitidoConLimites = ' ' . $permitido . ' ';
    $normalizada = normalizarTextoIdoneidadRecomendaciones($explicacion);

    // Cada cifra, con sus decimales tal cual («.50» no es «50»), debe figurar en los datos.
    $patronCifra = '/(?<![\d.,])(?:\d+(?:[.,]\d+)*|[.,]\d+)(?![\d])/';
    preg_match_all($patronCifra, $permitidoOriginal, $cifrasPermitidas);
    $cifrasPermitidas = array_map(static fn (string $c): string => str_replace(',', '.', $c), $cifrasPermitidas[0]);
    preg_match_all($patronCifra, $explicacion, $cifras);
    foreach ($cifras[0] as $cifra) {
        if (!in_array(str_replace(',', '.', $cifra), $cifrasPermitidas, true)) {
            return false;
        }
    }

    // Valoraciones que los datos verificados no pueden respaldar.
    $valoracionesNoVerificables = [
        'diseno', 'precio', 'barato', 'barata', 'caro', 'cara', 'calidad', 'comodo', 'comoda', 'comodidad',
        'ideal', 'perfecto', 'perfecta', 'excelente', 'mejor', 'premium', 'potente', 'rapido', 'rapida',
        'garantiza', 'garantizado', 'recomendable',
    ];
    foreach ($valoracionesNoVerificables as $termino) {
        if (
            strpos(' ' . $normalizada . ' ', ' ' . $termino . ' ') !== false &&
            strpos($permitidoConLimites, ' ' . $termino . ' ') === false
        ) {
            return false;
        }
    }

    $terminosTecnicos = [
        'hz', 'gb', 'tb', 'rtx', 'gtx', 'radeon', 'gddr', 'ms', 'latencia', 'bluetooth', 'usb', 'jack', 'cable',
        'inalambrico', 'inalambricos', 'ghz', 'envolvente', 'microfono', 'allm', 'vrr', 'dedicada',
        'integrada', 'nucleos', 'hilos', 'vram', 'ram', 'oled', 'qled', 'hdr', 'bateria', 'autonomia',
        'peso', 'ip', 'gps', 'resolucion', '4k', '8k', 'nvidia', 'amd', 'intel', 'ryzen', 'core',
    ];
    foreach ($terminosTecnicos as $termino) {
        if (
            strpos(' ' . $normalizada . ' ', ' ' . $termino . ' ') !== false &&
            strpos($permitidoConLimites, ' ' . $termino . ' ') === false
        ) {
            return false;
        }
    }

    return true;
}

/**
 * Forma la respuesta pública a partir de los niveles decididos en PHP.
 *
 * @param array{confirmed:list<array>, candidate:list<array>} $niveles
 * @param array<int, ?string> $explicacionesModelo [id => explicación] en el orden del modelo
 */
function construirRespuestaMixtaRecomendaciones(
    array $niveles,
    array $productosPorId,
    array $explicacionesModelo = []
): array {
    $posicionModelo = array_flip(array_keys($explicacionesModelo));
    $respuesta = ['recommendations' => [], 'candidates' => []];

    foreach (['confirmed' => 'recommendations', 'candidate' => 'candidates'] as $nivel => $lista) {
        $elementos = $niveles[$nivel] ?? [];
        // El modelo solo reordena dentro del nivel; los no mencionados conservan el orden de PHP.
        $ordenPhp = array_flip(array_column($elementos, 'id'));
        usort($elementos, static fn (array $a, array $b): int =>
            [$posicionModelo[$a['id']] ?? PHP_INT_MAX, $ordenPhp[$a['id']]] <=>
            [$posicionModelo[$b['id']] ?? PHP_INT_MAX, $ordenPhp[$b['id']]]);

        foreach ($elementos as $elemento) {
            $claveId = (string) $elemento['id'];
            if (!isset($productosPorId[$claveId])) {
                continue;
            }

            $explicacion = $explicacionesModelo[$elemento['id']] ?? null;
            $respuesta[$lista][] = [
                'producto' => $productosPorId[$claveId],
                'reason' => $explicacion ?? $elemento['reason'],
                'source' => $explicacion === null ? 'php' : 'ollama',
            ];
        }
    }

    if ($respuesta['recommendations'] === [] && $respuesta['candidates'] === []) {
        $respuesta['message'] = 'No encontramos coincidencias claras en el catálogo para esa búsqueda y uso. Prueba con otros términos.';
    }

    return $respuesta;
}

function normalizarTextoRecomendaciones(string $texto): string
{
    $texto = strtr(strtolower($texto), [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
        'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u', 'Ü' => 'u', 'Ñ' => 'n',
    ]);
    $texto = preg_replace('/[^a-z0-9]+/', ' ', $texto);

    return trim($texto ?? '');
}

function normalizarSinonimosRecomendaciones(string $texto): string
{
    $diccionarioSinonimos = [
        'portatil' => 'portatiles',
        'laptop' => 'portatiles',
        'laptops' => 'portatiles',
        'notebook' => 'portatiles',
        'notebooks' => 'portatiles',
        'ordenador portatil' => 'portatiles',
        'ordenadores portatiles' => 'portatiles',
        'tele' => 'television',
        'teles' => 'televisiones',
        'televisor' => 'television',
        'televisores' => 'televisiones',
        'tv' => 'television',
        'tvs' => 'televisiones',
        'casco' => 'auriculares',
        'cascos' => 'auriculares',
        'headphone' => 'auriculares',
        'headphones' => 'auriculares',
        'headset' => 'auriculares',
        'headsets' => 'auriculares',
        'airpod' => 'auriculares',
        'airpods' => 'auriculares',
        'movil' => 'moviles',
        'smartphone' => 'moviles',
        'smartphones' => 'moviles',
        'celular' => 'moviles',
        'celulares' => 'moviles',
        'telefono' => 'moviles',
        'telefonos' => 'moviles',
        'grafica' => 'tarjeta grafica',
        'graficas' => 'tarjetas graficas',
        'gpu' => 'tarjeta grafica',
        'gpus' => 'tarjetas graficas',
        'tarjeta grafica' => 'tarjeta grafica',
        'tarjetas graficas' => 'tarjetas graficas',
        'tarjetas grafica' => 'tarjetas graficas',
        'tarjeta de video' => 'tarjeta grafica',
        'tarjetas de video' => 'tarjetas graficas',
        'proce' => 'procesador',
        'cpu' => 'procesador',
        'cpus' => 'procesadores',
        'reloj inteligente' => 'smartwatch',
        'relojes inteligentes' => 'smartwatches',
        'smartwatches' => 'smartwatches',
        'watch' => 'smartwatch',
        'watches' => 'smartwatches',
    ];
    $textoNormalizado = normalizarTextoRecomendaciones($texto);
    $diccionarioNormalizado = [];

    foreach ($diccionarioSinonimos as $sinonimo => $canonico) {
        $diccionarioNormalizado[normalizarTextoRecomendaciones($sinonimo)] =
            normalizarTextoRecomendaciones($canonico);
    }

    $alternativas = array_keys($diccionarioNormalizado);
    usort($alternativas, static fn (string $a, string $b): int => strlen($b) <=> strlen($a));
    $patron = '/(?<![a-z0-9])(' . implode('|', array_map(
        static fn (string $termino): string => preg_quote($termino, '/'),
        $alternativas
    )) . ')(?![a-z0-9])/';

    return preg_replace_callback(
        $patron,
        static fn (array $coincidencia): string => $diccionarioNormalizado[$coincidencia[1]],
        $textoNormalizado
    ) ?? $textoNormalizado;
}

function resolverTipoProductoRecomendaciones(string $consulta, array $categorias): array
{
    $reglas = [
        'Portátiles' => [
            'portatil', 'portatiles', 'laptop', 'laptops', 'notebook', 'notebooks',
            'ordenador portatil', 'ordenadores portatiles',
        ],
        'Tarjetas gráficas' => [
            'tarjeta grafica', 'tarjetas graficas', 'gpu', 'gpus',
        ],
        'Procesadores' => ['procesador', 'procesadores', 'cpu', 'cpus'],
        'Móviles' => [
            'movil', 'moviles', 'smartphone', 'smartphones', 'celular', 'celulares',
        ],
        'Auriculares' => [
            'auricular', 'auriculares', 'headphone', 'headphones', 'headset', 'headsets',
        ],
        'Smartwatch' => [
            'smartwatch', 'smartwatches', 'reloj inteligente', 'relojes inteligentes',
        ],
        'Televisores' => [
            'televisor', 'televisores', 'television', 'televisiones', 'tv', 'tele',
        ],
    ];
    $consultaNormalizada = ' ' . normalizarTextoRecomendaciones($consulta) . ' ';
    $idsPorCategoria = [];

    foreach ($categorias as $categoria) {
        $nombreNormalizado = normalizarTextoRecomendaciones((string) $categoria['nombre']);
        $idsPorCategoria[$nombreNormalizado] = (int) $categoria['id'];

        if (str_ends_with($nombreNormalizado, 'es')) {
            $idsPorCategoria[substr($nombreNormalizado, 0, -2)] = (int) $categoria['id'];
        } elseif (str_ends_with($nombreNormalizado, 's')) {
            $idsPorCategoria[substr($nombreNormalizado, 0, -1)] = (int) $categoria['id'];
        }
    }

    $tipoExplicito = false;
    $categoriaIds = [];

    foreach ($reglas as $nombreCategoria => $alias) {
        foreach ($alias as $frase) {
            $fraseNormalizada = normalizarTextoRecomendaciones($frase);

            if (strpos($consultaNormalizada, ' ' . $fraseNormalizada . ' ') === false) {
                continue;
            }

            $tipoExplicito = true;
            $clavesCategoria = array_merge(
                [normalizarTextoRecomendaciones($nombreCategoria)],
                array_map('normalizarTextoRecomendaciones', $alias)
            );

            foreach ($clavesCategoria as $claveCategoria) {
                if (isset($idsPorCategoria[$claveCategoria])) {
                    $categoriaIds[] = $idsPorCategoria[$claveCategoria];
                }
            }

            break;
        }
    }

    $tiposNoDisponibles = [
        'raton', 'ratones', 'mouse', 'mice',
        'teclado', 'teclados', 'keyboard', 'keyboards',
        'monitor', 'monitores', 'impresora', 'impresoras',
        'tablet', 'tablets', 'camara', 'camaras', 'consola', 'consolas',
        'altavoz', 'altavoces', 'microfono', 'microfonos',
    ];
    $tipoNoDisponible = false;

    foreach ($tiposNoDisponibles as $frase) {
        if (strpos($consultaNormalizada, ' ' . $frase . ' ') !== false) {
            $tipoNoDisponible = true;
            $tipoExplicito = true;
            break;
        }
    }

    $tiposAmbiguos = [
        'pc', 'pcs', 'ordenador', 'ordenadores', 'computadora', 'computadoras',
    ];
    $tipoAmbiguo = false;

    foreach ($tiposAmbiguos as $frase) {
        if (strpos($consultaNormalizada, ' ' . $frase . ' ') !== false) {
            $tipoAmbiguo = true;
            $tipoExplicito = true;
            break;
        }
    }

    $categoriaIds = array_values(array_unique($categoriaIds));

    return [
        'explicito' => $tipoExplicito,
        'categoria_ids' => $categoriaIds,
        // Un tipo no vendido (micrófono, consola, cámara…) solo anula la búsqueda si no
        // se ha reconocido una categoría: «auriculares con micrófono» busca auriculares.
        'no_disponible' => $tipoNoDisponible && $categoriaIds === [],
        'ambiguo_sin_categoria' => $tipoAmbiguo && $categoriaIds === [],
        'sin_categoria_catalogo' => $tipoExplicito && !$tipoNoDisponible &&
            !$tipoAmbiguo && $categoriaIds === [],
    ];
}
