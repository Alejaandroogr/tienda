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

require_once __DIR__ . '/recomendaciones_usos.php';

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

/** Valor descrito sin su etiqueta («16 GB» en lugar de «RAM: 16 GB»). */
function valorDescritoRecomendaciones(string $clave, mixed $valor): ?string
{
    $descripcion = describirEspecificacionRecomendaciones($clave, $valor);

    return $descripcion === null ? null : substr($descripcion, strpos($descripcion, ': ') + 2);
}

function formatearNumeroRecomendaciones(float $numero): string
{
    return floor($numero) === $numero ? (string) (int) $numero : (string) $numero;
}

/**
 * Criterio de valor mínimo. El texto muestra primero el valor real y después el
 * mínimo: «pantalla de 144 Hz (mínimo 120 Hz)».
 *
 * @param string $plantilla Texto con %s para el valor, p. ej. «pantalla de %s» o «%s núcleos»
 * @param string $sinDato Texto cuando falta el dato, p. ej. «frecuencia de pantalla»
 */
function criterioMinimoRecomendaciones(
    array $especificaciones,
    string $clave,
    float $minimo,
    string $plantilla,
    string $sinDato,
    string $unidad = ''
): array {
    $valor = $especificaciones[$clave] ?? null;
    $conocido = (is_int($valor) || is_float($valor)) && is_finite((float) $valor);
    $textoMinimo = '(mínimo ' . formatearNumeroRecomendaciones($minimo) . ($unidad === '' ? '' : ' ' . $unidad) . ')';

    return [
        'cumple' => $conocido ? $valor >= $minimo : null,
        'texto' => $conocido
            ? sprintf($plantilla, valorDescritoRecomendaciones($clave, $valor)) . ' ' . $textoMinimo
            : $sinDato . ' ' . $textoMinimo,
    ];
}

function nombreConexionRecomendaciones(string $conexion): string
{
    return [
        'bluetooth' => 'Bluetooth',
        'usb_inalambrico' => 'inalámbrica 2.4 GHz (USB)',
        'jack' => 'cable jack',
    ][$conexion] ?? $conexion;
}

/**
 * Criterios aprobados por categoría e intención. Cada criterio indica si se
 * cumple (true), no se cumple (false) o falta el dato (null), y su texto final.
 * Devuelve null si la intención no tiene criterios aprobados para la categoría.
 *
 * @return list<array{cumple:?bool, texto:string}>|null
 */
function criteriosIntencionRecomendaciones(
    string $categoria,
    string $intencion,
    array $especificaciones,
    string $textoProducto,
    string $necesidadVoz
): ?array {
    if ($intencion === 'programacion') {
        return match ($categoria) {
            'portatiles' => [criterioMinimoRecomendaciones($especificaciones, 'ram_gb', 16, 'RAM de %s', 'RAM', 'GB')],
            'procesadores' => [criterioMinimoRecomendaciones($especificaciones, 'nucleos', 8, '%s núcleos', 'núcleos')],
            default => null,
        };
    }

    if ($intencion !== 'gaming') {
        return null;
    }

    switch ($categoria) {
        case 'portatiles':
            $gpu = $especificaciones['gpu_tipo'] ?? null;
            $modelo = $especificaciones['gpu_modelo'] ?? null;
            $modelo = is_string($modelo) && $modelo !== '' ? $modelo : null;

            return [
                match ($gpu) {
                    'dedicada' => ['cumple' => true, 'texto' => 'GPU dedicada' . ($modelo !== null ? ' (' . $modelo . ')' : '')],
                    'integrada' => ['cumple' => false, 'texto' => 'GPU integrada' . ($modelo !== null ? ' ' . $modelo : '') . ' (se pide dedicada)'],
                    default => ['cumple' => null, 'texto' => 'tipo de GPU (se pide dedicada)'],
                },
                criterioMinimoRecomendaciones($especificaciones, 'ram_gb', 16, 'RAM de %s', 'RAM', 'GB'),
                criterioMinimoRecomendaciones($especificaciones, 'pantalla_hz', 120, 'pantalla de %s', 'frecuencia de pantalla', 'Hz'),
            ];

        case 'auriculares':
            $conexion = $especificaciones['conexion'] ?? null;
            $conexiones = is_array($conexion) ? array_values(array_filter($conexion, 'is_string')) : [];
            $nombresConexion = implode(', ', array_map('nombreConexionRecomendaciones', $conexiones));
            $baja = array_values(array_intersect($conexiones, ['usb_inalambrico', 'jack']));
            $criterios = [
                $conexiones === []
                    ? ['cumple' => null, 'texto' => 'tipo de conexión (se pide 2.4 GHz o cable)']
                    : ($baja !== []
                        ? ['cumple' => true, 'texto' => 'conexión ' . implode(', ', array_map('nombreConexionRecomendaciones', $baja)) . ' (baja latencia)']
                        : ['cumple' => false, 'texto' => 'conexión ' . $nombresConexion . ' (se pide 2.4 GHz o cable)']),
            ];

            // Si la consulta niega el micrófono, deja de exigirse.
            if ($necesidadVoz !== 'negated') {
                $microfono = $especificaciones['microfono'] ?? null;
                $criterios[] = match ($microfono) {
                    true => ['cumple' => true, 'texto' => 'micrófono'],
                    false => ['cumple' => false, 'texto' => 'micrófono (no tiene)'],
                    default => ['cumple' => null, 'texto' => 'micrófono'],
                };
            }

            $termino = senalTextoGamingRecomendaciones($textoProducto);
            $criterios[] = $termino !== null
                ? ['cumple' => true, 'texto' => 'orientación gaming (menciona «' . $termino . '»)']
                : ['cumple' => false, 'texto' => 'orientación gaming (no menciona gaming, 7.1 ni sonido envolvente)'];

            return $criterios;

        case 'tarjetas graficas':
            return [criterioMinimoRecomendaciones($especificaciones, 'vram_gb', 8, 'VRAM de %s', 'VRAM', 'GB')];

        case 'procesadores':
            return [criterioMinimoRecomendaciones($especificaciones, 'nucleos', 6, '%s núcleos', 'núcleos')];

        case 'moviles':
            return [criterioMinimoRecomendaciones($especificaciones, 'ram_gb', 8, 'RAM de %s', 'RAM', 'GB')];

        case 'televisores':
            $funciones = $especificaciones['funciones_gaming'] ?? null;
            $funciones = is_array($funciones) ? array_values(array_intersect($funciones, ['ALLM', 'VRR'])) : [];

            return [
                criterioMinimoRecomendaciones($especificaciones, 'pantalla_hz', 120, 'pantalla de %s', 'frecuencia de pantalla', 'Hz'),
                $funciones !== []
                    ? ['cumple' => true, 'texto' => 'modo de juego ' . implode(' y ', $funciones)]
                    : ['cumple' => null, 'texto' => 'modo de juego ALLM o VRR'],
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
        // RAM y núcleos son criterios de programación; aquí solo quedan datos informativos.
        'portatiles' => ['programacion' => ['cpu_modelo', 'autonomia_h']],
        'procesadores' => ['programacion' => ['hilos']],
        'auriculares' => ['gimnasio' => ['resistencia_ip', 'formato', 'peso_g', 'autonomia_h']],
        'smartwatch' => ['gimnasio' => ['resistencia_agua_atm', 'gps', 'autonomia_dias']],
    ];

    return $intencion === null ? [] : ($mapa[$categoria][$intencion] ?? []);
}

/**
 * Evalúa un producto que ya cumple presupuesto, stock y categoría.
 *
 * Los usos se detectan con la categoría del producto («correr» es gimnasio en
 * auriculares y deporte en smartwatch); $usosForzados los sustituye cuando el uso
 * lo ha clasificado Ollama.
 *
 * - confirmed (recomendado): cumple cada uso (todos sus criterios, o valorado
 *   «adecuado» por el administrador sin datos en contra) y todas las
 *   características pedidas; o, sin uso, cumple todas las características pedidas.
 * - candidate (uso interno): falta algún dato o no cumple algún criterio.
 * - unknown: no se reconoce uso ni característica (lista «Disponibles»).
 * - excluded: valorado «no adecuado» para un uso pedido, un dato contradice una
 *   característica pedida, o (sin categoría pedida) no aplica a su categoría.
 *
 * @param list<string>|null $usosForzados
 * @return array{classification:'confirmed'|'candidate'|'unknown'|'excluded', puntuacion:float, reason:string, datos:list<string>, usos:list<string>}
 */
function evaluarProductoRecomendaciones(
    array $candidato,
    string $consulta,
    string $uso,
    bool $categoriaSolicitada,
    ?array $usosForzados = null
): array {
    $especificaciones = is_array($candidato['especificaciones'] ?? null) ? $candidato['especificaciones'] : [];
    $valoraciones = is_array($candidato['usos'] ?? null) ? $candidato['usos'] : [];
    $categoria = normalizarTextoIdoneidadRecomendaciones((string) ($candidato['categoria'] ?? ''));
    $textoSolicitud = normalizarTextoIdoneidadRecomendaciones($consulta . ' ' . $uso);
    $textoProducto = (string) ($candidato['nombre'] ?? '') . ' ' . (string) ($candidato['descripcion'] ?? '');
    $necesidadVoz = solicitudNecesitaComunicacionVozRecomendaciones($consulta . ' ' . $uso);
    $usosCategoria = catalogoUsosRecomendaciones()[$categoria] ?? [];
    $usosPedidos = $usosForzados !== null
        ? array_values(array_filter($usosForzados, static fn (string $u): bool => isset($usosCategoria[$u])))
        : detectarUsosCategoriaRecomendaciones($textoSolicitud, $categoria);
    $caracteristicas = detectarCaracteristicasRecomendaciones($consulta, $uso, $categoria);
    $resultado = static fn (string $clasificacion, string $motivo, float $puntuacion = 0.0, array $datos = []): array => [
        'classification' => $clasificacion,
        'puntuacion' => $puntuacion,
        'reason' => $motivo,
        'datos' => $datos,
        'usos' => $usosPedidos,
    ];

    if ($usosPedidos === [] && $caracteristicas === []) {
        return $categoriaSolicitada ? $resultado('unknown', '') : $resultado('excluded', '');
    }

    foreach ($usosPedidos as $usoPedido) {
        if (($valoraciones[$usoPedido] ?? null) === 'no_recomendado') {
            return $resultado('excluded', 'La tienda lo ha valorado como no adecuado para ' . etiquetaUsoRecomendaciones($usoPedido, $categoria) . '.');
        }
    }

    // Características pedidas: un dato en contra excluye; sin dato, no se puede confirmar.
    $pedidasCumplidas = [];
    $pedidasSinDato = [];
    foreach ($caracteristicas as $caracteristica) {
        $cumple = evaluarCaracteristicaRecomendaciones($caracteristica, $especificaciones);
        if ($cumple === false) {
            return $resultado('excluded', 'No cumple lo que pides: ' . $caracteristica['texto'] . '.');
        }
        if ($cumple === true) {
            $pedidasCumplidas[] = $caracteristica['texto'];
        } else {
            $pedidasSinDato[] = $caracteristica['texto'] . ' (no consta)';
        }
    }

    $puntuacion = (float) count($pedidasCumplidas);
    $frases = [];
    $datos = [];
    $desconocidos = [];
    $todosLosUsosCumplen = $usosPedidos !== [];

    foreach ($usosPedidos as $usoPedido) {
        $para = ' para ' . etiquetaUsoRecomendaciones($usoPedido, $categoria);
        $criterios = criteriosUsoRecomendaciones($categoria, $usoPedido, $especificaciones, $textoProducto, $necesidadVoz) ?? [];
        $cumplidos = [];
        $incumplidos = [];

        foreach ($criterios as $criterio) {
            if ($criterio['cumple'] === true) {
                $cumplidos[] = $criterio['texto'];
                $puntuacion += 1;
            } elseif ($criterio['cumple'] === false) {
                $incumplidos[] = $criterio['texto'];
                $puntuacion -= 1;
            } else {
                $desconocidos[] = $criterio['texto'];
            }
        }

        $valoradoAdecuado = ($valoraciones[$usoPedido] ?? null) === 'adecuado';
        $puntuacion += ($valoradoAdecuado ? 1 : 0) + bonusOrdenUsoRecomendaciones($categoria, $usoPedido, $especificaciones, $textoProducto);
        $cumpleTodos = $criterios !== [] && count($cumplidos) === count($criterios);
        $avaladoPorTienda = $valoradoAdecuado && $incumplidos === [];

        if ($cumpleTodos) {
            $frases[] = 'Cumple los criterios' . $para . ': ' . implode('; ', $cumplidos) . '.';
            if ($valoradoAdecuado) {
                $frases[] = 'Además, la tienda lo ha valorado como adecuado' . $para . '.';
            }
        } elseif ($avaladoPorTienda) {
            $frases[] = 'La tienda lo ha valorado como adecuado' . $para . ' y ningún dato lo contradice.';
            if ($cumplidos !== []) {
                $frases[] = 'Cumple: ' . implode('; ', $cumplidos) . '.';
            }
        } else {
            $todosLosUsosCumplen = false;
            $frases[] = 'Podría servirte' . $para . '.';
            if ($cumplidos !== []) {
                $frases[] = 'Cumple: ' . implode('; ', $cumplidos) . '.';
            }
            if ($incumplidos !== []) {
                $frases[] = 'No cumple: ' . implode('; ', $incumplidos) . '.';
            }
        }

        $datos = array_merge(
            $datos,
            array_map(static fn (string $c): string => 'cumple ' . $c, $cumplidos),
            array_map(static fn (string $c): string => 'no cumple ' . $c, $incumplidos),
            $valoradoAdecuado ? ['la tienda lo ha valorado como adecuado' . $para] : []
        );

        foreach (clavesPertinentesIntencionRecomendaciones($categoria, $usoPedido) as $clave) {
            $hecho = array_key_exists($clave, $especificaciones)
                ? describirEspecificacionRecomendaciones($clave, $especificaciones[$clave])
                : null;
            if ($hecho !== null && !in_array($hecho, $datos, true)) {
                $datos[] = $hecho;
            }
        }
    }

    $pedidasCumplen = $pedidasSinDato === [];
    $clasificacion = $pedidasCumplen && ($usosPedidos === [] ? $pedidasCumplidas !== [] : $todosLosUsosCumplen)
        ? 'confirmed'
        : 'candidate';

    if ($usosPedidos === []) {
        array_unshift($frases, $pedidasCumplidas !== []
            ? 'Cumple lo que pides: ' . implode('; ', $pedidasCumplidas) . '.'
            : 'Coincide con el tipo de producto que buscas.');
    } elseif ($pedidasCumplidas !== []) {
        $frases[] = 'Tiene ' . implode(' y ', $pedidasCumplidas) . ', como pides.';
    }
    if ($desconocidos !== [] || $pedidasSinDato !== []) {
        $frases[] = 'Sin dato registrado: ' . implode('; ', array_merge($desconocidos, $pedidasSinDato)) . '.';
    }

    $pertinentes = array_values(array_filter($datos, static fn (string $d): bool => !str_starts_with($d, 'cumple ') &&
        !str_starts_with($d, 'no cumple ') && !str_starts_with($d, 'la tienda ')));
    if ($pertinentes !== []) {
        $frases[] = 'Datos registrados: ' . implode('; ', $pertinentes) . '.';
    }

    $datos = array_merge(
        $datos,
        array_map(static fn (string $c): string => 'sin dato: ' . $c, array_merge($desconocidos, $pedidasSinDato)),
        array_map(static fn (string $c): string => 'tiene ' . $c . ', como pide el cliente', $pedidasCumplidas)
    );

    return $resultado($clasificacion, implode(' ', $frases), $puntuacion, $datos);
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
function validarRespuestaModeloRecomendaciones(mixed $respuesta, array $productos, string $textoSolicitud = ''): array
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
            explicacionModeloEsVerificableRecomendaciones($explicacion, $productos[(string) $id], $textoSolicitud)
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
 * Una explicación es aceptable si es breve, sin enlaces ni HTML, si cada cifra y
 * cada término técnico que menciona aparece en los datos verificados del producto,
 * y si todas sus palabras salen de esos datos, de la consulta o de una lista corta
 * de palabras de enlace (así se descartan palabras cortadas o añadidas).
 */
function explicacionModeloEsVerificableRecomendaciones(string $explicacion, array $producto, string $textoSolicitud = ''): bool
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

    $palabrasEnlace = [
        'los', 'las', 'del', 'con', 'sin', 'para', 'por', 'que', 'pero', 'tambien', 'ademas', 'muy', 'mas',
        'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'como', 'porque', 'todo', 'todos', 'ambos', 'ambas',
        'sus', 'una', 'uno', 'unos', 'unas', 'hay', 'son', 'ser', 'esta', 'estan', 'cada', 'tanto', 'asi',
        'segun', 'sobre', 'entre', 'tiene', 'tienen', 'cumple', 'cumplen', 'ofrece', 'ofrecen', 'incluye',
        'incluyen', 'dispone', 'disponen', 'cuenta', 'cuentan', 'puede', 'pueden', 'permite', 'gracias',
        'encaja', 'encajan', 'opcion', 'producto', 'productos', 'modelo', 'requisito', 'requisitos',
        'pides', 'pide', 'buscas', 'busca', 'necesitas', 'necesita', 'cliente', 'tus', 'usted',
        'llega', 'llegan', 'alcanza', 'alcanzan', 'supera', 'superan', 'solo', 'aunque', 'sino',
    ];
    $palabrasDatos = array_values(array_filter(
        array_merge(explode(' ', $permitido), explode(' ', normalizarTextoIdoneidadRecomendaciones($textoSolicitud))),
        static fn (string $palabra): bool => $palabra !== ''
    ));
    $vocabulario = array_flip(array_merge($palabrasDatos, $palabrasEnlace));
    $ajenas = 0;
    foreach (explode(' ', $normalizada) as $palabra) {
        if (strlen($palabra) < 3 || ctype_digit($palabra) || isset($vocabulario[$palabra])) {
            continue;
        }

        // Fragmento cortado de una palabra de los datos («auric» de «auriculares»).
        foreach ($palabrasDatos as $palabraDato) {
            if (strlen($palabraDato) > strlen($palabra) && str_starts_with($palabraDato, $palabra)) {
                return false;
            }
        }

        if (++$ajenas > 3) {
            return false;
        }
    }

    return true;
}

const RECOMENDACIONES_MENSAJE_SIN_RECOMENDADOS =
    'No hay productos que cumplan todo lo que pides. Prueba a ampliar el presupuesto o cambiar la búsqueda.';

/**
 * Forma la respuesta pública. Solo incluye los productos recomendados: los demás
 * niveles se calculan internamente pero no se muestran.
 *
 * @param array{confirmed:list<array>, candidate?:list<array>} $niveles
 * @param array<int, ?string> $explicacionesModelo [id => explicación] en el orden del modelo
 * @return array{recommendations:list<array{producto:array, reason:string, source:string}>, message?:string}
 */
function construirRespuestaRecomendaciones(
    array $niveles,
    array $productosPorId,
    array $explicacionesModelo = []
): array {
    $posicionModelo = array_flip(array_keys($explicacionesModelo));
    $elementos = $niveles['confirmed'] ?? [];
    // El modelo solo reordena los recomendados; los no mencionados conservan el orden de PHP.
    $ordenPhp = array_flip(array_column($elementos, 'id'));
    usort($elementos, static fn (array $a, array $b): int =>
        [$posicionModelo[$a['id']] ?? PHP_INT_MAX, $ordenPhp[$a['id']]] <=>
        [$posicionModelo[$b['id']] ?? PHP_INT_MAX, $ordenPhp[$b['id']]]);

    $respuesta = ['recommendations' => []];
    foreach ($elementos as $elemento) {
        $claveId = (string) $elemento['id'];
        if (!isset($productosPorId[$claveId])) {
            continue;
        }

        $explicacion = $explicacionesModelo[$elemento['id']] ?? null;
        $respuesta['recommendations'][] = [
            'producto' => $productosPorId[$claveId],
            'reason' => $explicacion ?? $elemento['reason'],
            'source' => $explicacion === null ? 'php' : 'ollama',
        ];
    }

    if ($respuesta['recommendations'] === []) {
        $respuesta['message'] = RECOMENDACIONES_MENSAJE_SIN_RECOMENDADOS;
    }

    return $respuesta;
}

const RECOMENDACIONES_EJEMPLOS_CONSULTA =
    'Prueba con algo como «portátil para programar», «auriculares para el gimnasio» o «tele para ver series».';

function mensajeConsultaIrreconocibleRecomendaciones(): string
{
    return 'No hemos entendido qué buscas. ' . RECOMENDACIONES_EJEMPLOS_CONSULTA;
}

function mensajeTipoNoDisponibleRecomendaciones(): string
{
    return 'No tenemos ese tipo de producto en el catálogo. ' . RECOMENDACIONES_EJEMPLOS_CONSULTA;
}

function mensajePcAmbiguoRecomendaciones(): string
{
    return '«PC» puede ser un portátil, una tarjeta gráfica o un procesador. Indica cuál buscas, por ejemplo «portátil para jugar».';
}

/** @param list<string> $nombresCategorias */
function avisoUsoDesconocidoRecomendaciones(array $nombresCategorias): string
{
    return 'No hemos identificado para qué lo quieres. Estos son los productos de ' . implode(', ', $nombresCategorias) .
        ' disponibles; dinos el uso y te recomendaremos los que mejor encajen.';
}

/**
 * @param list<string> $etiquetasUsos
 * @param list<string> $nombresCategorias
 */
function avisoUsoNoAplicableRecomendaciones(array $etiquetasUsos, array $nombresCategorias): string
{
    return 'No valoramos ' . implode(', ', $nombresCategorias) . ' para ' . implode(' ni para ', $etiquetasUsos) .
        ', así que no hemos tenido en cuenta ese uso.';
}

/** @param list<string> $nombresCategorias */
function mensajeSinStockRecomendaciones(array $nombresCategorias, ?string $agotadoQueCumple): string
{
    $mensaje = $nombresCategorias === []
        ? 'No hay productos disponibles ahora mismo.'
        : 'No hay ' . mb_strtolower(implode(' ni ', $nombresCategorias), 'UTF-8') . ' disponibles ahora mismo.';

    return $agotadoQueCumple === null
        ? $mensaje
        : $mensaje . ' El «' . $agotadoQueCumple . '» cumpliría lo que pides, pero está agotado.';
}

/** @param array{nombre:string, precio:string} $producto */
function mensajeMasBaratoQueCumpleRecomendaciones(string $presupuestoEuros, ?string $etiquetaUsos, array $producto): string
{
    return 'Ninguno de los productos que cumplen entra en tu presupuesto (' . formatearPrecioRecomendaciones($presupuestoEuros) .
        '). El más barato que cumple ' . ($etiquetaUsos === null ? 'lo que pides' : 'para ' . $etiquetaUsos) .
        ' es «' . $producto['nombre'] . '», por ' . formatearPrecioRecomendaciones($producto['precio']) . '.';
}

/** @param list<string> $etiquetasUsos */
function mensajeVariosUsosSinResultadoRecomendaciones(array $etiquetasUsos): string
{
    return 'Ninguno cumple a la vez para ' . implode(' y para ', $etiquetasUsos) . '. Prueba a buscarlos por separado.';
}

function formatearPrecioRecomendaciones(string $precio): string
{
    return number_format((float) $precio, 2, ',', '.') . ' €';
}

/**
 * Mensaje cuando ningún producto entra en el presupuesto. Si se pidió una
 * categoría, indica el producto más barato disponible de ella (sin recomendarlo).
 *
 * @param list<string> $nombresCategorias
 * @param array{nombre:string, precio:string}|null $masBarato
 */
function mensajeSinProductosEnPresupuestoRecomendaciones(
    array $nombresCategorias,
    string $presupuestoEuros,
    ?array $masBarato
): string {
    $presupuesto = formatearPrecioRecomendaciones($presupuestoEuros);

    if ($nombresCategorias === []) {
        return 'No hay productos disponibles dentro de tu presupuesto (' . $presupuesto . ').';
    }

    $categorias = implode(', ', $nombresCategorias);
    if ($masBarato === null) {
        return 'No hay productos de ' . $categorias . ' disponibles en este momento.';
    }

    return 'No hay productos de ' . $categorias . ' dentro de tu presupuesto (' . $presupuesto . '). ' .
        'El más barato disponible es «' . $masBarato['nombre'] . '», por ' .
        formatearPrecioRecomendaciones($masBarato['precio']) . '.';
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
            'smartwatch', 'smartwatches', 'reloj inteligente', 'relojes inteligentes', 'reloj', 'relojes',
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
