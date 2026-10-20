<?php

declare(strict_types=1);

/**
 * Catálogo de usos por categoría, detección del uso y de características
 * explícitas, y criterios de cada uso. Funciones puras: no consultan la BD ni Ollama.
 *
 * Todos los atributos que usan los criterios están en el esquema del perfil
 * (perfil_recomendacion.php). Si un producto no tiene alguno rellenado, ese
 * criterio queda «sin dato» y nunca cuenta como cumplido.
 */

// Como máximo dos usos por consulta («para programar y jugar»): un producto debe cumplirlos todos.
const RECOMENDACIONES_MAX_USOS = 2;

/**
 * Usos que se valoran en cada categoría (clave: nombre de categoría normalizado).
 * La etiqueta se usa en los textos al cliente («para jugar») y los sinónimos, ya
 * normalizados, son las palabras clave que lo detectan. Se construye una sola vez.
 *
 * @return array<string, array<string, array{etiqueta:string, sinonimos:list<string>}>>
 */
function catalogoUsosRecomendaciones(): array
{
    static $catalogo = null;

    if ($catalogo !== null) {
        return $catalogo;
    }

    $gaming = [
        'gaming', 'gamer', 'juego', 'juegos', 'jugar', 'videojuego', 'videojuegos',
        'consola', 'consolas', 'ps5', 'playstation', 'xbox', 'esports', 'fps',
    ];
    $programacion = [
        'programacion', 'programar', 'programador', 'programadora', 'desarrollo', 'desarrollar',
        'desarrollador', 'desarrolladora', 'codigo', 'software', 'backend', 'python',
    ];
    $trabajo = [
        'trabajo', 'trabajar', 'oficina', 'ofimatica', 'teletrabajo', 'estudiar', 'estudios',
        'estudiante', 'universidad', 'clase', 'clases', 'excel', 'word',
    ];
    $edicion = ['editar', 'edicion', 'video', 'videos', 'montaje', 'premiere', 'davinci', 'photoshop', 'lightroom'];
    $uso = static fn (string $etiqueta, array $sinonimos): array => ['etiqueta' => $etiqueta, 'sinonimos' => $sinonimos];

    $catalogo = [
        'portatiles' => [
            'gaming' => $uso('jugar', $gaming),
            'programacion' => $uso('programar', $programacion),
            'trabajo' => $uso('trabajar o estudiar', $trabajo),
            'edicion' => $uso('editar vídeo o fotos', $edicion),
            'movilidad' => $uso('llevarlo encima', [
                'ligero', 'ligera', 'viajar', 'viaje', 'viajes', 'llevar', 'llevarlo', 'transportar',
                'bateria', 'autonomia', 'pequeno', 'pequena',
            ]),
        ],
        'tarjetas graficas' => [
            'gaming' => $uso('jugar', array_merge($gaming, ['1080p', '1440p', '4k'])),
            'edicion' => $uso('editar vídeo o fotos', $edicion),
            'creacion_3d' => $uso('crear en 3D', [
                '3d', 'blender', 'modelado', 'modelar', 'render', 'renderizar', 'renderizado', 'cad', 'arquitectura', 'unreal',
            ]),
            'ia' => $uso('inteligencia artificial', [
                'ia', 'inteligencia artificial', 'machine learning', 'deep learning', 'aprendizaje automatico',
                'entrenar modelos', 'llm', 'llms', 'stable diffusion', 'cuda',
            ]),
        ],
        'procesadores' => [
            'gaming' => $uso('jugar', $gaming),
            'programacion' => $uso('programar', $programacion),
            'trabajo' => $uso('trabajar o estudiar', $trabajo),
            'edicion' => $uso('editar vídeo o fotos', $edicion),
        ],
        'auriculares' => [
            'gaming' => $uso('jugar', $gaming),
            'musica' => $uso('escuchar música', [
                'musica', 'escuchar musica', 'spotify', 'podcast', 'podcasts', 'canciones', 'audiofilo', 'audiofila', 'hifi', 'hi fi',
            ]),
            'trabajo' => $uso('trabajar y hacer llamadas', [
                'teletrabajo', 'llamadas', 'llamada', 'reuniones', 'reunion', 'videollamadas', 'videollamada',
                'teams', 'zoom', 'oficina', 'trabajo', 'trabajar',
            ]),
            'gimnasio' => $uso('el gimnasio o hacer deporte', [
                'gym', 'gimnasio', 'entrenar', 'entrenamiento', 'ejercicio', 'correr', 'running', 'deporte', 'deportes', 'crossfit',
            ]),
            'viajes' => $uso('viajar', ['viajar', 'viaje', 'viajes', 'avion', 'tren', 'transporte', 'metro', 'aislar']),
        ],
        'moviles' => [
            'fotografia' => $uso('hacer fotos', [
                'foto', 'fotos', 'fotografia', 'fotografias', 'camara', 'selfie', 'selfies',
                'grabar video', 'grabar videos', 'instagram',
            ]),
            'gaming' => $uso('jugar', $gaming),
            'trabajo' => $uso('trabajar', ['trabajo', 'trabajar', 'correo', 'oficina', 'empresa']),
            'viajes' => $uso('viajar', ['viajar', 'viaje', 'viajes', 'bateria', 'autonomia', 'todo el dia']),
        ],
        'smartwatch' => [
            'gimnasio' => $uso('el gimnasio', [
                'gym', 'gimnasio', 'entrenar', 'entrenamiento', 'pesas', 'calorias', 'crossfit', 'ejercicio',
            ]),
            'deporte' => $uso('hacer deporte', [
                'correr', 'running', 'ciclismo', 'bici', 'bicicleta', 'montana', 'trail', 'triatlon', 'senderismo', 'deporte', 'deportes',
            ]),
            'salud' => $uso('cuidar la salud', [
                'salud', 'sueno', 'dormir', 'pulso', 'frecuencia cardiaca', 'oxigeno', 'estres', 'ecg', 'tension',
            ]),
            'trabajo' => $uso('el trabajo', ['notificaciones', 'trabajo', 'trabajar', 'mensajes', 'reuniones']),
        ],
        'televisores' => [
            'gaming' => $uso('jugar', $gaming),
            'cine_streaming' => $uso('ver películas y series', [
                'pelicula', 'peliculas', 'peli', 'pelis', 'serie', 'series', 'netflix', 'cine', 'streaming', 'disney', 'hbo', 'prime video',
            ]),
            'deportes' => $uso('ver deportes', [
                'futbol', 'deportes', 'deporte', 'partido', 'partidos', 'f1', 'formula 1', 'champions', 'liga',
            ]),
        ],
    ];

    return $catalogo;
}

/** Etiqueta del uso en la categoría indicada (la misma clave puede tener otra etiqueta en otra categoría). */
function etiquetaUsoRecomendaciones(string $uso, ?string $categoria = null): string
{
    $catalogo = catalogoUsosRecomendaciones();

    if ($categoria !== null && isset($catalogo[$categoria][$uso])) {
        return $catalogo[$categoria][$uso]['etiqueta'];
    }

    foreach ($catalogo as $usos) {
        if (isset($usos[$uso])) {
            return $usos[$uso]['etiqueta'];
        }
    }

    return $uso;
}

/**
 * Usos de una categoría mencionados en el texto (ya normalizado), sin los negados,
 * en el orden en que aparecen y como máximo RECOMENDACIONES_MAX_USOS.
 *
 * @return list<string>
 */
function detectarUsosCategoriaRecomendaciones(string $textoNormalizado, string $categoria): array
{
    $usos = catalogoUsosRecomendaciones()[$categoria] ?? [];
    $texto = ' ' . eliminarUsosNegadosRecomendaciones($textoNormalizado) . ' ';
    $posiciones = [];

    foreach ($usos as $id => $definicion) {
        foreach ($definicion['sinonimos'] as $sinonimo) {
            $posicion = strpos($texto, ' ' . $sinonimo . ' ');
            if ($posicion !== false && (!isset($posiciones[$id]) || $posicion < $posiciones[$id])) {
                $posiciones[$id] = $posicion;
            }
        }
    }

    // Por posición de la primera mención: si se piden más de dos usos, cuentan los primeros.
    asort($posiciones);

    return array_slice(array_keys($posiciones), 0, RECOMENDACIONES_MAX_USOS);
}

/**
 * Usos mencionados en cualquier categoría: [uso => lista de categorías].
 * Sirve para avisar cuando el uso pedido no existe en la categoría buscada.
 *
 * @return array<string, list<string>>
 */
function detectarUsosGlobalesRecomendaciones(string $textoNormalizado): array
{
    $resultado = [];

    foreach (array_keys(catalogoUsosRecomendaciones()) as $categoria) {
        foreach (detectarUsosCategoriaRecomendaciones($textoNormalizado, $categoria) as $uso) {
            $resultado[$uso][] = $categoria;
        }
    }

    return $resultado;
}

/** Busca el patrón en el texto si no va precedido de «sin», «no» o «ni». */
function coincidenciaNoNegadaRecomendaciones(string $patron, string $texto, ?array &$grupos = null): bool
{
    if (preg_match_all($patron, $texto, $todas, PREG_SET_ORDER | PREG_OFFSET_CAPTURE) === 0) {
        return false;
    }

    // Basta con que una aparición no esté negada. Se miran los 12 caracteres previos:
    // la negación y, como mucho, una palabra intermedia («sin cancelación», «no quiero gps»).
    foreach ($todas as $coincidencia) {
        $antes = substr($texto, max(0, $coincidencia[0][1] - 12), min(12, $coincidencia[0][1]));
        if (preg_match('/\b(?:sin|no|ni)\s+(?:\S+\s+)?$/', $antes) !== 1) {
            $grupos = array_map(static fn (array $grupo): string => $grupo[0], $coincidencia);
            return true;
        }
    }

    return false;
}

/**
 * Características pedidas explícitamente en la consulta que se pueden comprobar
 * con los atributos de la categoría.
 *
 * @return list<array{tipo:string, clave:string, valor:mixed, texto:string}>
 */
function detectarCaracteristicasRecomendaciones(string $consulta, string $uso, string $categoria): array
{
    // Las pulgadas se buscan en el texto original: la normalización quita las comillas (65")
    // y las comas decimales (6,1 pulgadas).
    $original = mb_strtolower($consulta . ' ' . $uso, 'UTF-8');
    $texto = normalizarTextoIdoneidadRecomendaciones($consulta . ' ' . $uso);
    $caracteristicas = [];
    $agregar = static function (string $tipo, string $clave, mixed $valor, string $descripcion) use (&$caracteristicas): void {
        $caracteristicas[] = ['tipo' => $tipo, 'clave' => $clave, 'valor' => $valor, 'texto' => $descripcion];
    };
    $minimoNumerico = static function (string $patron, string $clave, string $plantilla) use ($texto, $agregar): void {
        if (coincidenciaNoNegadaRecomendaciones($patron, $texto, $grupos)) {
            $agregar('minimo', $clave, (float) $grupos[1], sprintf($plantilla, $grupos[1]));
        }
    };
    $pulgadas = static function () use ($original, $agregar): void {
        // «más de 55 pulgadas» es un mínimo; «de 55 pulgadas», un tamaño aproximado (±1,5).
        if (preg_match('/(m[aá]s de|m[ií]nimo|al menos|desde)?\s*(\d{2,3}(?:[.,]\d)?)\s*(?:pulgadas|")/u', $original, $m) === 1) {
            $valor = (float) str_replace(',', '.', $m[2]);
            $m[1] !== ''
                ? $agregar('minimo', 'pantalla_pulgadas', $valor, 'pantalla de ' . $m[2] . ' pulgadas o más')
                : $agregar('aproximado', 'pantalla_pulgadas', $valor, 'pantalla de unas ' . $m[2] . ' pulgadas');
        }
    };

    switch ($categoria) {
        case 'portatiles':
            if (solicitudExigeGpuDedicadaRecomendaciones($texto)) {
                $agregar('igual', 'gpu_tipo', 'dedicada', 'GPU dedicada');
            }
            $minimoNumerico('/\b(\d{1,3}) ?gb(?: de)? ram\b/', 'ram_gb', 'RAM de %s GB o más');
            $minimoNumerico('/\b(\d{2,3}) ?hz\b/', 'pantalla_hz', 'pantalla de %s Hz o más');
            $pulgadas();
            break;

        case 'tarjetas graficas':
            $minimoNumerico('/\b(\d{1,2}) ?gb\b/', 'vram_gb', 'VRAM de %s GB o más');
            break;

        case 'procesadores':
            $minimoNumerico('/\b(\d{1,3}) nucleos\b/', 'nucleos', '%s núcleos o más');
            $minimoNumerico('/\b(\d{1,3}) hilos\b/', 'hilos', '%s hilos o más');
            break;

        case 'moviles':
            $minimoNumerico('/\b(\d{1,2}) ?gb(?: de)? ram\b/', 'ram_gb', 'RAM de %s GB o más');
            $minimoNumerico('/\b(\d{2,3}) ?hz\b/', 'pantalla_hz', 'pantalla de %s Hz o más');
            break;

        case 'auriculares':
            if (solicitudNecesitaComunicacionVozRecomendaciones($consulta . ' ' . $uso) === 'affirmative') {
                $agregar('igual', 'microfono', true, 'micrófono');
            }
            if (coincidenciaNoNegadaRecomendaciones('/\b(?:cancelacion(?: activa)? de(?:l)? ruido|anc|noise cancelling)\b/', $texto)) {
                $agregar('igual', 'cancelacion_ruido', true, 'cancelación de ruido');
            }
            if (coincidenciaNoNegadaRecomendaciones('/\b(?:resistentes? al agua|impermeables?|sumergibles?|sudor)\b/', $texto)) {
                $agregar('ip_agua', 'resistencia_ip', 4, 'resistencia al agua (IPX4 o más)');
            }
            if (preg_match('/\bsin cables?\b|\binalambric[oa]s?\b/', $texto) === 1) {
                $agregar('contiene_alguno', 'conexion', ['bluetooth', 'usb_inalambrico'], 'inalámbricos');
            } elseif (coincidenciaNoNegadaRecomendaciones('/\bbluetooth\b/', $texto)) {
                $agregar('contiene_alguno', 'conexion', ['bluetooth'], 'Bluetooth');
            }
            if (coincidenciaNoNegadaRecomendaciones('/\bcon cable\b|\bjack\b/', $texto)) {
                $agregar('contiene_alguno', 'conexion', ['jack'], 'cable jack');
            }
            break;

        case 'smartwatch':
            if (coincidenciaNoNegadaRecomendaciones('/\bgps\b/', $texto)) {
                $agregar('igual', 'gps', true, 'GPS');
            }
            if (coincidenciaNoNegadaRecomendaciones('/\b(?:nadar|natacion|sumergible|piscina|bucear|buceo)\b/', $texto)) {
                $agregar('minimo', 'resistencia_agua_atm', 5.0, 'resistencia al agua de 5 ATM o más');
            }
            if (preg_match('/\b(?:compatible con |para (?:mi |un )?)(?:iphone|ios)\b/', $texto) === 1) {
                $agregar('contiene_alguno', 'compatibilidad', ['ios'], 'compatible con iPhone');
            }
            if (preg_match('/\b(?:compatible con |para (?:mi |un )?(?:movil )?)android\b/', $texto) === 1) {
                $agregar('contiene_alguno', 'compatibilidad', ['android'], 'compatible con Android');
            }
            break;

        case 'televisores':
            if (preg_match('/\b8k\b/', $texto) === 1) {
                $agregar('contiene_alguno', 'resolucion', ['8K'], 'resolución 8K');
            } elseif (preg_match('/\b(?:4k|uhd|ultra hd)\b/', $texto) === 1) {
                $agregar('contiene_alguno', 'resolucion', ['4K', '8K'], 'resolución 4K o superior');
            }
            if (coincidenciaNoNegadaRecomendaciones('/\bhdr\b|\bdolby vision\b/', $texto)) {
                $agregar('lista_no_vacia', 'hdr', null, 'HDR');
            }
            $minimoNumerico('/\b(\d{2,3}) ?hz\b/', 'pantalla_hz', 'pantalla de %s Hz o más');
            $pulgadas();
            break;
    }

    return $caracteristicas;
}

/** true si la cumple, false si un dato la contradice, null si falta el dato. */
function evaluarCaracteristicaRecomendaciones(array $caracteristica, array $especificaciones): ?bool
{
    $valor = $especificaciones[$caracteristica['clave']] ?? null;

    if ($valor === null) {
        return null;
    }

    switch ($caracteristica['tipo']) {
        case 'igual':
            return $valor === $caracteristica['valor'];
        case 'minimo':
            return (is_int($valor) || is_float($valor)) ? $valor >= $caracteristica['valor'] : null;
        case 'aproximado':
            return (is_int($valor) || is_float($valor)) ? abs($valor - $caracteristica['valor']) <= 1.5 : null;
        case 'contiene_alguno':
            $lista = is_array($valor) ? $valor : [$valor];
            return array_intersect($lista, $caracteristica['valor']) !== [];
        case 'lista_no_vacia':
            return is_array($valor) ? $valor !== [] : null;
        case 'ip_agua':
            // Un grado IP sin protección frente al agua (IP6X) es un dato en contra, no un dato que falta.
            $digito = digitoAguaResistenciaIpRecomendaciones($valor);
            return $digito === null ? false : $digito >= $caracteristica['valor'];
    }

    return null;
}

/** Segundo dígito de un grado IP (protección frente al agua): IP57 → 7, IPX4 → 4, IP6X → null. */
function digitoAguaResistenciaIpRecomendaciones(mixed $grado): ?int
{
    if (!is_string($grado) || preg_match('/\AIP[0-6X]([0-9])K?\z/i', $grado, $m) !== 1) {
        return null;
    }

    return (int) $m[1];
}

/**
 * Criterio de valor máximo (por ejemplo, el peso), simétrico a criterioMinimoRecomendaciones().
 *
 * @param array<string, mixed> $especificaciones
 */
function criterioMaximoRecomendaciones(
    array $especificaciones,
    string $clave,
    float $maximo,
    string $plantilla,
    string $sinDato,
    string $unidad
): array {
    $valor = $especificaciones[$clave] ?? null;
    $conocido = (is_int($valor) || is_float($valor)) && is_finite((float) $valor);
    $textoMaximo = '(máximo ' . formatearNumeroRecomendaciones($maximo) . ' ' . $unidad . ')';

    return [
        'cumple' => $conocido ? $valor <= $maximo : null,
        'texto' => $conocido
            ? sprintf($plantilla, valorDescritoRecomendaciones($clave, $valor)) . ' ' . $textoMaximo
            : $sinDato . ' ' . $textoMaximo,
    ];
}

/** Criterio de sí/no: true cumple, false no cumple y sin dato queda pendiente (null). */
function criterioBooleanoRecomendaciones(array $especificaciones, string $clave, string $nombre): array
{
    $valor = $especificaciones[$clave] ?? null;

    return match ($valor) {
        true => ['cumple' => true, 'texto' => $nombre],
        false => ['cumple' => false, 'texto' => $nombre . ' (no tiene)'],
        default => ['cumple' => null, 'texto' => $nombre],
    };
}

/**
 * Criterio sobre un atributo de tipo lista (sensores, HDR). Con $requeridos vacío,
 * basta con que la lista tenga algún elemento.
 *
 * @param list<string> $requeridos todos deben figurar en la lista
 */
function criterioListaContieneRecomendaciones(array $especificaciones, string $clave, array $requeridos, string $nombre): array
{
    $valor = $especificaciones[$clave] ?? null;

    if (!is_array($valor) || $valor === []) {
        return ['cumple' => null, 'texto' => $nombre];
    }

    $faltan = array_diff($requeridos, $valor);

    return [
        'cumple' => $faltan === [],
        'texto' => $nombre . ($faltan === [] ? '' : ' (no tiene ' . implode(', ', $faltan) . ')'),
    ];
}

/**
 * Criterios obligatorios de un uso para la categoría. Devuelve null si la
 * categoría no tiene ese uso y [] si el uso solo se recomienda cuando lo marca
 * el administrador (auriculares para música).
 *
 * @return list<array{cumple:?bool, texto:string}>|null
 */
function criteriosUsoRecomendaciones(
    string $categoria,
    string $uso,
    array $especificaciones,
    string $textoProducto,
    string $necesidadVoz
): ?array {
    if (!isset(catalogoUsosRecomendaciones()[$categoria][$uso])) {
        return null;
    }

    $minimo = static fn (string $clave, float $valor, string $plantilla, string $sinDato, string $unidad = ''): array =>
        criterioMinimoRecomendaciones($especificaciones, $clave, $valor, $plantilla, $sinDato, $unidad);

    switch ($categoria . '/' . $uso) {
        case 'portatiles/gaming':
        case 'auriculares/gaming':
        case 'tarjetas graficas/gaming':
        case 'procesadores/gaming':
        case 'moviles/gaming':
        case 'televisores/gaming':
            return criteriosIntencionRecomendaciones($categoria, 'gaming', $especificaciones, $textoProducto, $necesidadVoz);

        case 'portatiles/programacion':
        case 'procesadores/programacion':
            return criteriosIntencionRecomendaciones($categoria, 'programacion', $especificaciones, $textoProducto, $necesidadVoz);

        case 'portatiles/trabajo':
            return [$minimo('ram_gb', 8, 'RAM de %s', 'RAM', 'GB')];

        case 'portatiles/edicion':
            return [
                $minimo('ram_gb', 16, 'RAM de %s', 'RAM', 'GB'),
                $minimo('almacenamiento_gb', 512, 'almacenamiento de %s', 'almacenamiento', 'GB'),
            ];

        case 'portatiles/movilidad':
            return [
                criterioMaximoRecomendaciones($especificaciones, 'peso_kg', 1.6, 'peso de %s', 'peso', 'kg'),
                $minimo('autonomia_h', 10, 'autonomía de %s', 'autonomía', 'h'),
            ];

        case 'tarjetas graficas/edicion':
            return [$minimo('vram_gb', 8, 'VRAM de %s', 'VRAM', 'GB')];

        case 'tarjetas graficas/creacion_3d':
        case 'tarjetas graficas/ia':
            return [$minimo('vram_gb', 12, 'VRAM de %s', 'VRAM', 'GB')];

        case 'procesadores/trabajo':
            return [$minimo('nucleos', 4, '%s núcleos', 'núcleos')];

        case 'procesadores/edicion':
            return [$minimo('nucleos', 8, '%s núcleos', 'núcleos'), $minimo('hilos', 16, '%s hilos', 'hilos')];

        case 'auriculares/musica':
            return [];

        case 'auriculares/trabajo':
            return [
                criterioBooleanoRecomendaciones($especificaciones, 'microfono', 'micrófono'),
                $minimo('autonomia_h', 8, 'autonomía de %s', 'autonomía', 'h'),
            ];

        case 'auriculares/gimnasio':
            $ip = $especificaciones['resistencia_ip'] ?? null;
            $digito = digitoAguaResistenciaIpRecomendaciones($ip);
            $formato = $especificaciones['formato'] ?? null;

            return [
                is_string($ip)
                    ? ['cumple' => $digito !== null && $digito >= 4, 'texto' => 'resistencia ' . $ip . ' (mínimo IPX4)']
                    : ['cumple' => null, 'texto' => 'resistencia al agua (mínimo IPX4)'],
                is_string($formato)
                    ? ['cumple' => $formato === 'in_ear', 'texto' => 'formato ' . str_replace('_', '-', $formato) . ' (se pide in-ear)']
                    : ['cumple' => null, 'texto' => 'formato (se pide in-ear)'],
            ];

        case 'auriculares/viajes':
            $auricular = $especificaciones['autonomia_h'] ?? null;
            $estuche = $especificaciones['autonomia_estuche_h'] ?? null;
            // Autonomía total = auricular + estuche. Si falta la del estuche, solo se puede
            // afirmar que cumple cuando el auricular ya llega a 20 h por sí solo.
            $total = is_int($auricular) || is_float($auricular)
                ? $auricular + ((is_int($estuche) || is_float($estuche)) ? $estuche : 0)
                : null;
            $totalConocido = $total !== null && ($total >= 20 || is_int($estuche) || is_float($estuche));

            return [
                criterioBooleanoRecomendaciones($especificaciones, 'cancelacion_ruido', 'cancelación de ruido'),
                $totalConocido
                    ? ['cumple' => $total >= 20, 'texto' => 'autonomía total de ' . formatearNumeroRecomendaciones((float) $total) . ' h (mínimo 20 h)']
                    : ['cumple' => null, 'texto' => 'autonomía total (mínimo 20 h)'],
            ];

        case 'moviles/fotografia':
            return [$minimo('camara_principal_mp', 48, 'cámara principal de %s', 'cámara principal', 'MP')];

        case 'moviles/trabajo':
            return [
                $minimo('ram_gb', 6, 'RAM de %s', 'RAM', 'GB'),
                $minimo('almacenamiento_gb', 128, 'almacenamiento de %s', 'almacenamiento', 'GB'),
            ];

        case 'moviles/viajes':
            return [$minimo('autonomia_h', 20, 'autonomía de %s', 'autonomía', 'h')];

        case 'smartwatch/gimnasio':
            return [criterioListaContieneRecomendaciones($especificaciones, 'sensores', ['frecuencia_cardiaca'], 'sensor de frecuencia cardíaca')];

        case 'smartwatch/deporte':
            return [criterioBooleanoRecomendaciones($especificaciones, 'gps', 'GPS')];

        case 'smartwatch/salud':
            return [criterioListaContieneRecomendaciones($especificaciones, 'sensores', ['frecuencia_cardiaca', 'sueno'], 'sensores de frecuencia cardíaca y sueño')];

        case 'smartwatch/trabajo':
            $compatibilidad = $especificaciones['compatibilidad'] ?? null;

            return [
                is_array($compatibilidad) && $compatibilidad !== []
                    ? ['cumple' => true, 'texto' => 'compatible con ' . implode(' y ', array_map(static fn (string $s): string => $s === 'ios' ? 'iPhone' : 'Android', $compatibilidad))]
                    : ['cumple' => null, 'texto' => 'compatibilidad con el móvil'],
                $minimo('autonomia_dias', 2, 'autonomía de %s', 'autonomía', 'días'),
            ];

        case 'televisores/cine_streaming':
            $resolucion = $especificaciones['resolucion'] ?? null;

            return [
                is_string($resolucion)
                    ? ['cumple' => in_array($resolucion, ['4K', '8K'], true), 'texto' => 'resolución ' . $resolucion . ' (mínimo 4K)']
                    : ['cumple' => null, 'texto' => 'resolución (mínimo 4K)'],
                criterioListaContieneRecomendaciones($especificaciones, 'hdr', [], 'HDR'),
            ];

        case 'televisores/deportes':
            return [
                $minimo('pantalla_hz', 100, 'pantalla de %s', 'frecuencia de pantalla', 'Hz'),
                $minimo('pantalla_pulgadas', 50, 'pantalla de %s', 'tamaño de pantalla', 'pulgadas'),
            ];
    }

    return null;
}

/**
 * Bonus de orden de un uso (atributos que «solo ordenan»): nunca llega a 1, para
 * no pesar tanto como un criterio.
 */
function bonusOrdenUsoRecomendaciones(string $categoria, string $uso, array $especificaciones, string $textoProducto): float
{
    $numero = static fn (string $clave): ?float =>
        (is_int($especificaciones[$clave] ?? null) || is_float($especificaciones[$clave] ?? null)) ? (float) $especificaciones[$clave] : null;
    $bonus = 0.0;

    switch ($categoria . '/' . $uso) {
        case 'portatiles/gaming':
            $bonus += senalTextoGamingRecomendaciones($textoProducto) !== null ? 0.5 : 0.0;
            break;
        case 'portatiles/programacion':
        case 'portatiles/trabajo':
            $bonus += min($numero('autonomia_h') ?? 0.0, 24.0) / 48;
            if ($uso === 'trabajo' && $numero('peso_kg') !== null) {
                $bonus += max(0.0, 3.0 - $numero('peso_kg')) / 12;
            }
            break;
        case 'portatiles/edicion':
            $bonus += ($especificaciones['gpu_tipo'] ?? null) === 'dedicada' ? 0.3 : 0.0;
            $bonus += ($numero('pantalla_pulgadas') ?? 0.0) >= 15 ? 0.2 : 0.0;
            break;
        case 'portatiles/movilidad':
            $bonus += $numero('peso_kg') !== null ? max(0.0, 1.6 - $numero('peso_kg')) / 2 : 0.0;
            break;
        case 'tarjetas graficas/ia':
            $bonus += ($especificaciones['fabricante'] ?? null) === 'nvidia' ? 0.5 : 0.0;
            break;
        case 'auriculares/musica':
        case 'auriculares/trabajo':
            $bonus += ($especificaciones['cancelacion_ruido'] ?? null) === true ? 0.3 : 0.0;
            if ($uso === 'musica') {
                $bonus += ($especificaciones['formato'] ?? null) === 'over_ear' ? 0.3 : 0.0;
                $bonus += min($numero('autonomia_h') ?? 0.0, 40.0) / 160;
            }
            break;
        case 'auriculares/gimnasio':
            $bonus += $numero('peso_g') !== null ? max(0.0, 50.0 - $numero('peso_g')) / 200 : 0.0;
            break;
        case 'moviles/fotografia':
        case 'moviles/gaming':
            $bonus += $uso === 'gaming'
                ? min($numero('pantalla_hz') ?? 0.0, 144.0) / 300
                : min($numero('almacenamiento_gb') ?? 0.0, 1024.0) / 2400;
            break;
        case 'moviles/viajes':
            $bonus += digitoAguaResistenciaIpRecomendaciones($especificaciones['resistencia_ip'] ?? null) !== null ? 0.3 : 0.0;
            break;
        case 'smartwatch/gimnasio':
        case 'smartwatch/deporte':
            $bonus += min($numero('autonomia_dias') ?? 0.0, 30.0) / 70;
            break;
        case 'smartwatch/salud':
            $sensores = is_array($especificaciones['sensores'] ?? null) ? $especificaciones['sensores'] : [];
            $bonus += count(array_intersect($sensores, ['spo2', 'ecg'])) * 0.2;
            break;
        case 'televisores/cine_streaming':
            $bonus += min($numero('pantalla_pulgadas') ?? 0.0, 85.0) / 200;
            break;
    }

    return min($bonus, 0.9);
}

/**
 * Valida la clasificación del uso hecha por Ollama: solo se acepta un uso de la
 * lista cerrada o «ninguno». Devuelve el uso o null.
 *
 * @param list<string> $permitidos
 */
function validarClasificacionUsoModeloRecomendaciones(mixed $respuesta, array $permitidos): ?string
{
    if (!is_array($respuesta) || array_keys($respuesta) !== ['uso'] || !is_string($respuesta['uso'])) {
        throw new ErrorRespuestaModeloRecomendaciones('invalid_model_response', 'Clasificación de uso inválida');
    }

    if ($respuesta['uso'] === 'ninguno') {
        return null;
    }

    if (!in_array($respuesta['uso'], $permitidos, true)) {
        throw new ErrorRespuestaModeloRecomendaciones('invalid_model_response', 'Uso fuera de la lista permitida');
    }

    return $respuesta['uso'];
}
