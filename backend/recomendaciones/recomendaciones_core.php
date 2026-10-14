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

/** @return list<array{id:int, assessment:string, evidence:list<string>, reason:string}> */
function validarRespuestaModeloRecomendaciones(mixed $respuesta, array $candidatos): array
{
    if (
        !is_array($respuesta) ||
        array_diff(array_keys($respuesta), ['recommendations']) !== [] ||
        !array_key_exists('recommendations', $respuesta)
    ) {
        throw new ErrorRespuestaModeloRecomendaciones(
            'invalid_model_response',
            'El servicio local devolvió una respuesta inválida'
        );
    }

    $recomendaciones = $respuesta['recommendations'];
    if (
        !is_array($recomendaciones) ||
        !array_is_list($recomendaciones) ||
        count($recomendaciones) > 3
    ) {
        throw new ErrorRespuestaModeloRecomendaciones(
            'invalid_model_response',
            'El servicio local devolvió una respuesta inválida'
        );
    }

    $resultado = [];
    $idsVistos = [];

    foreach ($recomendaciones as $recomendacion) {
        if (
            !is_array($recomendacion) ||
            array_diff(array_keys($recomendacion), ['id', 'assessment', 'evidence']) !== [] ||
            array_diff(['id', 'assessment', 'evidence'], array_keys($recomendacion)) !== []
        ) {
            throw new ErrorRespuestaModeloRecomendaciones(
                'invalid_model_response',
                'El servicio local devolvió una respuesta inválida'
            );
        }

        $id = $recomendacion['id'];
        $assessment = $recomendacion['assessment'];
        $evidencias = $recomendacion['evidence'];

        if (!is_int($id) || $id <= 0) {
            throw new ErrorRespuestaModeloRecomendaciones(
                'invalid_model_response',
                'El servicio local devolvió una respuesta inválida'
            );
        }

        $claveId = (string) $id;
        if (!array_key_exists($claveId, $candidatos)) {
            throw new ErrorRespuestaModeloRecomendaciones(
                'invalid_product_id',
                'El servicio local seleccionó un producto que no se puede recomendar'
            );
        }
        if (isset($idsVistos[$claveId])) {
            throw new ErrorRespuestaModeloRecomendaciones(
                'invalid_model_response',
                'El servicio local devolvió un producto repetido'
            );
        }
        if (!in_array($assessment, ['supported', 'uncertain'], true)) {
            throw new ErrorRespuestaModeloRecomendaciones(
                'invalid_model_response',
                'El servicio local devolvió una evaluación inválida'
            );
        }
        if (!is_array($evidencias) || !array_is_list($evidencias) || count($evidencias) > 8) {
            throw new ErrorRespuestaModeloRecomendaciones(
                'invalid_model_evidence',
                'El servicio local devolvió evidencias inválidas'
            );
        }

        $especificaciones = $candidatos[$claveId]['especificaciones'] ?? null;
        if (!is_array($especificaciones)) {
            throw new ErrorRespuestaModeloRecomendaciones(
                'invalid_model_evidence',
                'No se pudieron verificar las especificaciones del producto'
            );
        }

        $evidenciasUnicas = [];
        $hechos = [];
        foreach ($evidencias as $evidencia) {
            if (
                !is_string($evidencia) ||
                isset($evidenciasUnicas[$evidencia]) ||
                !array_key_exists($evidencia, $especificaciones)
            ) {
                throw new ErrorRespuestaModeloRecomendaciones(
                    'invalid_model_evidence',
                    'El servicio local citó una especificación desconocida o no disponible'
                );
            }

            $hecho = describirEspecificacionRecomendaciones($evidencia, $especificaciones[$evidencia]);
            if ($hecho === null) {
                throw new ErrorRespuestaModeloRecomendaciones(
                    'invalid_model_evidence',
                    'No se pudo verificar una especificación citada por el servicio local'
                );
            }

            $evidenciasUnicas[$evidencia] = true;
            $hechos[] = $hecho;
        }

        if ($assessment === 'supported' && $hechos === []) {
            throw new ErrorRespuestaModeloRecomendaciones(
                'invalid_model_evidence',
                'Una recomendación respaldada debe citar especificaciones conocidas'
            );
        }

        $razon = $assessment === 'supported'
            ? 'La evaluación se apoya en estas especificaciones técnicas conocidas: ' .
                implode('; ', $hechos) . '. La valoración es orientativa.'
            : 'La información técnica disponible no basta para confirmar la idoneidad.' .
                ($hechos === []
                    ? ' No hay especificaciones conocidas que permitan respaldarla.'
                    : ' Datos conocidos: ' . implode('; ', $hechos) . '.');

        $resultado[] = [
            'id' => $id,
            'assessment' => $assessment,
            'evidence' => array_keys($evidenciasUnicas),
            'reason' => $razon,
        ];
        $idsVistos[$claveId] = true;
    }

    return $resultado;
}

/**
 * Clasifica en PHP usando únicamente reglas afirmativas explícitamente aprobadas
 * y especificaciones del perfil. Actualmente no hay reglas de suficiencia
 * aprobadas: ningún valor de assessment de Ollama puede confirmar un producto.
 *
 * @return array{classification:'confirmed'|'candidate'|'excluded', reason:string}
 */
function clasificarIdoneidadFinalRecomendaciones(
    array $candidato,
    string $consulta,
    string $uso
): array {
    $especificaciones = is_array($candidato['especificaciones'] ?? null)
        ? $candidato['especificaciones']
        : [];
    $categoria = normalizarTextoIdoneidadRecomendaciones((string) ($candidato['categoria'] ?? ''));
    $textoSolicitud = normalizarTextoIdoneidadRecomendaciones($consulta . ' ' . $uso);

    $intencion = detectarIntencionTecnicaRecomendaciones($textoSolicitud);

    // Gaming en portátiles requiere una regla y evidencia objetiva de rendimiento
    // que todavía no están aprobadas; nombres/modelos de GPU no bastan.
    if ($categoria === 'portatiles' && $intencion === 'gaming') {
        return ['classification' => 'excluded', 'reason' => ''];
    }

    if (
        $categoria === 'portatiles' &&
        solicitudExigeGpuDedicadaRecomendaciones($textoSolicitud) &&
        ($especificaciones['gpu_tipo'] ?? null) === 'integrada'
    ) {
        return [
            'classification' => 'excluded',
            'reason' => 'El perfil contradice el requisito explícito de GPU dedicada.',
        ];
    }

    if ($categoria === 'auriculares' && $intencion === 'gaming') {
        $senales = [];
        $conexionesGamingAprobadas = ['bluetooth', 'usb_inalambrico', 'jack'];
        $conexion = $especificaciones['conexion'] ?? null;
        $conexiones = is_string($conexion) ? [$conexion] : (is_array($conexion) ? $conexion : []);
        $conexionesPertinentes = array_values(array_filter(
            $conexiones,
            static fn (mixed $valor): bool => is_string($valor) && in_array($valor, $conexionesGamingAprobadas, true)
        ));

        if ($conexionesPertinentes !== []) {
            $senales[] = 'El perfil declara conexión: ' . implode(', ', array_unique($conexionesPertinentes)) .
                '; esto acredita únicamente el tipo de conexión registrado, no latencia, estabilidad, compatibilidad ni idoneidad global.';
        }

        $necesitaVoz = solicitudNecesitaComunicacionVozRecomendaciones($textoSolicitud);
        if ($necesitaVoz === 'affirmative' && ($especificaciones['microfono'] ?? null) === true) {
            $senales[] = 'El perfil declara que dispone de micrófono; esto no acredita calidad de captación, claridad, compatibilidad ni idoneidad global.';
        }

        if ($senales === []) {
            return ['classification' => 'excluded', 'reason' => ''];
        }

        return [
            'classification' => 'candidate',
            'reason' => implode(' ', $senales) . ' Estas señales parciales no confirman la idoneidad global.',
        ];
    }

    $clavesPertinentes = clavesPertinentesIntencionRecomendaciones($categoria, $intencion);
    if ($intencion === null || $clavesPertinentes === []) {
        return ['classification' => 'excluded', 'reason' => ''];
    }

    $hechosPertinentes = [];
    foreach ($clavesPertinentes as $clave) {
        if (!array_key_exists($clave, $especificaciones)) {
            continue;
        }

        $hecho = describirEspecificacionRecomendaciones($clave, $especificaciones[$clave]);
        if ($hecho !== null) {
            $hechosPertinentes[] = $hecho;
        }
    }

    if ($hechosPertinentes === []) {
        return ['classification' => 'excluded', 'reason' => ''];
    }

    if (cumpleCriterioAfirmativoAprobadoRecomendaciones($intencion, $candidato, $hechosPertinentes)) {
        return [
            'classification' => 'confirmed',
            'reason' => 'La idoneidad está respaldada por el criterio técnico aprobado y estos datos verificados: ' .
                implode('; ', $hechosPertinentes) . '.',
        ];
    }

    return [
        'classification' => 'candidate',
        'reason' => 'Puede ser pertinente para ' . $intencion . ' por estos datos verificados del perfil: ' .
            implode('; ', $hechosPertinentes) . '. No existe un criterio técnico aprobado que permita confirmar su idoneidad.',
    ];
}

/** @return bool Actualmente no hay reglas aprobadas de suficiencia afirmativa. */
function cumpleCriterioAfirmativoAprobadoRecomendaciones(
    string $intencion,
    array $candidato,
    array $hechosVerificados
): bool {
    return false;
}

/**
 * Forma la respuesta pública mixta a partir de clasificaciones PHP.
 *
 * @return array{recommendations:list<array{producto:array,reason:string}>, candidates:list<array{producto:array,reason:string}>, message?:string}
 */
function construirRespuestaMixtaRecomendaciones(array $clasificaciones, array $productosPorId): array
{
    $respuesta = ['recommendations' => [], 'candidates' => []];

    foreach ($clasificaciones as $clasificacion) {
        $id = (int) ($clasificacion['id'] ?? 0);
        $tipo = $clasificacion['classification'] ?? null;
        $claveId = (string) $id;
        if (
            $id <= 0 ||
            !isset($productosPorId[$claveId]) ||
            !is_string($clasificacion['reason'] ?? null)
        ) {
            continue;
        }

        if ($tipo === 'confirmed') {
            $respuesta['recommendations'][] = [
                'producto' => $productosPorId[$claveId],
                'reason' => $clasificacion['reason'],
            ];
        } elseif ($tipo === 'candidate') {
            $respuesta['candidates'][] = [
                'producto' => $productosPorId[$claveId],
                'reason' => $clasificacion['reason'],
            ];
        }
    }

    if ($respuesta['recommendations'] === [] && $respuesta['candidates'] === []) {
        $respuesta['message'] = 'No encontramos coincidencias claras en el catálogo para esa búsqueda y uso. Prueba con otros términos.';
    }

    return $respuesta;
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
        'gaming' => ['gaming', 'gamer', 'juego', 'juegos', 'jugar', 'videojuego', 'videojuegos'],
        'programacion' => ['programacion', 'programar', 'programador', 'desarrollo', 'desarrollar', 'codigo'],
        'gimnasio' => ['gym', 'gimnasio', 'entrenamiento', 'entrenar', 'ejercicio'],
    ];
    $textoConLimites = ' ' . $textoNormalizado . ' ';

    foreach ($intenciones as $intencion => $terminos) {
        foreach ($terminos as $termino) {
            if (strpos($textoConLimites, ' ' . $termino . ' ') !== false) {
                return $intencion;
            }
        }
    }

    return null;
}

/**
 * Claves que describen aspectos técnicamente relacionados con cada intención.
 * Pertinencia no implica suficiencia: la aprobación afirmativa permanece vacía
 * hasta que se definan y aprueben reglas objetivas de suficiencia.
 *
 * @return list<string>
 */
function clavesPertinentesIntencionRecomendaciones(string $categoria, ?string $intencion): array
{
    $mapa = [
        'portatiles' => [
            'gaming' => ['gpu_tipo', 'gpu_modelo'],
            'programacion' => ['cpu_modelo', 'ram_gb'],
        ],
        'tarjetas graficas' => [
            'gaming' => ['vram_gb'],
        ],
        'procesadores' => [
            'gaming' => ['nucleos', 'hilos'],
            'programacion' => ['nucleos', 'hilos'],
        ],
        'auriculares' => [
            'gimnasio' => ['resistencia_ip', 'formato', 'peso_g', 'autonomia_h'],
        ],
        'moviles' => [
            'gaming' => ['ram_gb', 'almacenamiento_gb'],
        ],
        'smartwatch' => [
            'gimnasio' => ['resistencia_agua_atm', 'gps', 'autonomia_dias'],
        ],
        'televisiones' => [
            'gaming' => ['funciones_gaming', 'pantalla_hz'],
        ],
    ];

    return $intencion === null ? [] : ($mapa[$categoria][$intencion] ?? []);
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
        'ram_gb' => 'RAM',
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
    } elseif (is_array($valor) && array_is_list($valor) && count(array_filter($valor, 'is_string')) === count($valor)) {
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
