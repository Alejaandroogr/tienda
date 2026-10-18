<?php

/**
 * Perfil de recomendación de un producto: los datos verificados que usa el asistente.
 *
 * - usos: valoración del administrador por uso («adecuado» o «no_recomendado»).
 * - atributos: especificaciones técnicas según el esquema de su categoría.
 *
 * Aquí está el esquema de cada categoría (el único origen de verdad; el frontend
 * mantiene una copia que un test compara con este), su validación, las reglas para
 * conservar o descartar el perfil al editar un producto y el guardado en la tabla
 * perfil_recomendacion_producto (migración 001).
 */

declare(strict_types=1);

/** Error de validación o guardado del perfil, con el código y el estado HTTP que debe ver el panel. */
final class ErrorPerfilRecomendacion extends RuntimeException
{
    public function __construct(
        public readonly string $codigo,
        string $mensaje,
        public readonly int $estadoHttp = 422
    ) {
        parent::__construct($mensaje);
    }
}

/**
 * Valida un perfil completo contra el esquema de la categoría del producto.
 * Se recibe decodificado como objetos (stdClass) para distinguir un objeto vacío {}
 * de una lista [], que en arrays de PHP serían lo mismo.
 *
 * @return array{usos: array<string, string>, atributos: array<string, mixed>}
 */
function validarPerfilRecomendacion(mixed $perfil, string $categoria): array
{
    if (!$perfil instanceof stdClass) {
        throw new ErrorPerfilRecomendacion(
            'invalid_type',
            'El perfil IA debe ser un objeto JSON'
        );
    }

    $datosPerfil = get_object_vars($perfil);
    $clavesPerfilPermitidas = ['usos', 'atributos'];
    $clavesDesconocidas = array_diff(array_keys($datosPerfil), $clavesPerfilPermitidas);

    if ($clavesDesconocidas !== []) {
        if (in_array('categoria_id', $clavesDesconocidas, true)) {
            throw new ErrorPerfilRecomendacion(
                'category_profile_mismatch',
                'La categoría del perfil se obtiene del producto y no se acepta desde la petición'
            );
        }

        throw new ErrorPerfilRecomendacion(
            'invalid_attribute',
            'El perfil contiene campos no permitidos'
        );
    }

    $esquema = esquemaPerfilPorCategoria($categoria);
    $usos = validarUsosPerfilRecomendacion($datosPerfil['usos'] ?? null, $esquema['usos']);
    $atributos = validarAtributosPerfilRecomendacion(
        $datosPerfil['atributos'] ?? null,
        $esquema['atributos']
    );

    return ['usos' => $usos, 'atributos' => $atributos];
}

/**
 * Completa una edición parcial sin trasladar clasificaciones entre categorías.
 * Los usos expresos siempre se dejan al validador; si se omiten, se conservan
 * solo cuando existe un perfil de la misma categoría.
 */
function completarUsosOmitidosEdicionPerfilRecomendacion(
    stdClass $perfil,
    ?string $usosExistentesJson,
    bool $categoriaCambio
): stdClass {
    return completarCampoOmitidoEdicionPerfilRecomendacion(
        $perfil,
        'usos',
        $usosExistentesJson,
        $categoriaCambio
    );
}

/** Igual que los usos: los atributos omitidos se conservan solo en la misma categoría. */
function completarAtributosOmitidosEdicionPerfilRecomendacion(
    stdClass $perfil,
    ?string $atributosExistentesJson,
    bool $categoriaCambio
): stdClass {
    return completarCampoOmitidoEdicionPerfilRecomendacion(
        $perfil,
        'atributos',
        $atributosExistentesJson,
        $categoriaCambio
    );
}

/**
 * Si el campo no viene en la petición, se rellena con el valor guardado (misma categoría)
 * o con un objeto vacío (categoría nueva o sin perfil previo).
 *
 * @param 'usos'|'atributos' $campo
 */
function completarCampoOmitidoEdicionPerfilRecomendacion(
    stdClass $perfil,
    string $campo,
    ?string $valorExistenteJson,
    bool $categoriaCambio
): stdClass {
    if (property_exists($perfil, $campo)) {
        return $perfil;
    }

    if ($categoriaCambio || $valorExistenteJson === null) {
        $perfil->{$campo} = new stdClass();
        return $perfil;
    }

    try {
        $valorExistente = json_decode($valorExistenteJson, false, 16, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        throw new ErrorPerfilRecomendacion(
            'invalid_stored_profile',
            "No se pudieron conservar los {$campo} del perfil existente",
            500
        );
    }

    if (!$valorExistente instanceof stdClass) {
        throw new ErrorPerfilRecomendacion(
            'invalid_stored_profile',
            "Los {$campo} del perfil existente no tienen un formato válido",
            500
        );
    }

    $perfil->{$campo} = $valorExistente;
    return $perfil;
}

/** Solo las categorías con esquema admiten perfil; las demás se pueden crear, pero el asistente no las evalúa. */
function categoriaAdmitePerfilRecomendacion(string $categoria): bool
{
    try {
        esquemaPerfilPorCategoria($categoria);
    } catch (ErrorPerfilRecomendacion) {
        return false;
    }

    return true;
}

/** Un perfil es vacío si es null o si sus usos y atributos no contienen ningún valor. */
function perfilRecomendacionVacio(mixed $perfil): bool
{
    if ($perfil === null) {
        return true;
    }

    if (!$perfil instanceof stdClass) {
        return false;
    }

    foreach (get_object_vars($perfil) as $valor) {
        if ($valor === null) {
            continue;
        }

        if (!$valor instanceof stdClass) {
            return false;
        }

        foreach (get_object_vars($valor) as $elemento) {
            if ($elemento !== null && $elemento !== '' && $elemento !== []) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Decide qué hacer con el perfil al crear o editar un producto.
 * Las categorías sin esquema no admiten perfil: un perfil vacío se ignora y,
 * si el producto se mueve a una de ellas, el perfil anterior se elimina.
 *
 * @return 'guardar'|'restablecer'|'eliminar'|'ninguna'
 */
function planificarPerfilProductoRecomendacion(
    bool $perfilEnviado,
    mixed $perfil,
    bool $admitePerfil,
    bool $categoriaCambio
): string {
    if (!$admitePerfil) {
        if ($perfilEnviado && !perfilRecomendacionVacio($perfil)) {
            throw new ErrorPerfilRecomendacion(
                'invalid_category',
                'La categoría del producto no está habilitada para perfiles IA'
            );
        }

        return $categoriaCambio ? 'eliminar' : 'ninguna';
    }

    if ($perfilEnviado) {
        return 'guardar';
    }

    return $categoriaCambio ? 'restablecer' : 'ninguna';
}

/**
 * Usos y atributos admitidos en cada categoría, con su tipo y sus límites.
 * Debe coincidir con camposPorCategoria y usosPorCategoria de src/services/perfilRecomendacionService.ts
 * (lo comprueba tests/perfilRecomendacionService.test.mjs).
 *
 * @return array{usos: list<string>, atributos: array<string, array<string, mixed>>}
 */
function esquemaPerfilPorCategoria(string $categoria): array
{
    $categoriaNormalizada = normalizarCategoriaPerfilRecomendacion($categoria);
    $numeroPositivo = static fn (float $maximo): array => [
        'tipo' => 'numero_positivo',
        'maximo' => $maximo,
    ];
    $enteroPositivo = static fn (int $maximo): array => [
        'tipo' => 'entero_positivo',
        'maximo' => $maximo,
    ];
    $texto = static fn (int $maximo): array => [
        'tipo' => 'string',
        'maximo' => $maximo,
    ];
    $enumerado = static fn (array $valores): array => [
        'tipo' => 'enum',
        'valores' => $valores,
    ];
    $lista = static fn (array $valores): array => [
        'tipo' => 'lista',
        'valores' => $valores,
    ];

    $esquemas = [
        'portatiles' => [
            'usos' => ['gaming', 'programacion', 'trabajo', 'edicion', 'movilidad'],
            'atributos' => [
                'cpu_modelo' => $texto(120),
                'ram_gb' => $numeroPositivo(1024),
                'gpu_tipo' => $enumerado(['integrada', 'dedicada']),
                'gpu_modelo' => $texto(120),
                'peso_kg' => $numeroPositivo(100),
                'autonomia_h' => $numeroPositivo(1000),
                'pantalla_pulgadas' => $numeroPositivo(200),
                'pantalla_hz' => $numeroPositivo(1000),
                'almacenamiento_gb' => $numeroPositivo(100000),
            ],
        ],
        'tarjetas graficas' => [
            'usos' => ['gaming', 'edicion', 'creacion_3d', 'ia'],
            'atributos' => [
                'vram_gb' => $numeroPositivo(512),
                'rendimiento_gaming' => $enumerado(['entrada', 'media', 'alta']),
                'fabricante' => $enumerado(['nvidia', 'amd', 'intel']),
            ],
        ],
        'procesadores' => [
            'usos' => ['gaming', 'programacion', 'trabajo', 'edicion'],
            'atributos' => [
                'nucleos' => $enteroPositivo(1024),
                'hilos' => $enteroPositivo(4096),
                'rendimiento' => $enumerado(['entrada', 'media', 'alta']),
            ],
        ],
        'moviles' => [
            'usos' => ['fotografia', 'gaming', 'trabajo', 'viajes'],
            'atributos' => [
                'ram_gb' => $numeroPositivo(1024),
                'almacenamiento_gb' => $numeroPositivo(100000),
                'autonomia_h' => $numeroPositivo(1000),
                'resistencia_ip' => ['tipo' => 'resistencia_ip'],
                'peso_g' => $numeroPositivo(10000),
                'camara_principal_mp' => $numeroPositivo(1000),
                'pantalla_hz' => $numeroPositivo(1000),
            ],
        ],
        'auriculares' => [
            'usos' => ['gimnasio', 'gaming', 'trabajo', 'musica', 'viajes'],
            'atributos' => [
                'conexion' => $lista(['bluetooth', 'usb_inalambrico', 'jack']),
                'autonomia_h' => $numeroPositivo(1000),
                'autonomia_estuche_h' => $numeroPositivo(5000),
                'resistencia_ip' => ['tipo' => 'resistencia_ip'],
                'formato' => $enumerado(['in_ear', 'on_ear', 'over_ear']),
                'microfono' => ['tipo' => 'booleano'],
                'peso_g' => $numeroPositivo(10000),
                'latencia_ms' => $numeroPositivo(10000),
                'cancelacion_ruido' => ['tipo' => 'booleano'],
            ],
        ],
        'smartwatch' => [
            'usos' => ['gimnasio', 'deporte', 'salud', 'trabajo'],
            'atributos' => [
                'autonomia_dias' => $numeroPositivo(3650),
                'resistencia_agua_atm' => $numeroPositivo(1000),
                'gps' => ['tipo' => 'booleano'],
                'compatibilidad' => $lista(['ios', 'android']),
                'sensores' => $lista(['frecuencia_cardiaca', 'spo2', 'ecg', 'sueno', 'temperatura']),
            ],
        ],
        'televisores' => [
            'usos' => ['gaming', 'cine_streaming', 'deportes'],
            'atributos' => [
                'pantalla_pulgadas' => $numeroPositivo(200),
                'resolucion' => $enumerado(['HD', 'Full HD', '4K', '8K']),
                'pantalla_hz' => $numeroPositivo(1000),
                'funciones_gaming' => $lista(['ALLM', 'VRR']),
                'hdr' => $lista(['HDR10', 'HDR10+', 'Dolby Vision', 'HLG']),
            ],
        ],
    ];

    if (!isset($esquemas[$categoriaNormalizada])) {
        throw new ErrorPerfilRecomendacion(
            'invalid_category',
            'La categoría del producto no está habilitada para perfiles IA'
        );
    }

    return $esquemas[$categoriaNormalizada];
}

/** «Tarjetas gráficas» → «tarjetas graficas»: el nombre de la categoría en la BD se compara sin tildes ni mayúsculas. */
function normalizarCategoriaPerfilRecomendacion(string $categoria): string
{
    $categoria = strtr(mb_strtolower($categoria, 'UTF-8'), [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
    ]);

    return trim($categoria);
}

/** @param list<string> $usosPermitidos
 *  @return array<string, string>
 */
function validarUsosPerfilRecomendacion(mixed $usos, array $usosPermitidos): array
{
    if ($usos === null) {
        return [];
    }

    if (!$usos instanceof stdClass) {
        throw new ErrorPerfilRecomendacion(
            'invalid_type',
            'Los usos deben ser un objeto JSON'
        );
    }

    $valores = get_object_vars($usos);
    $resultado = [];

    foreach ($valores as $uso => $estado) {
        if (!in_array($uso, $usosPermitidos, true)) {
            throw new ErrorPerfilRecomendacion(
                'invalid_use',
                'El uso no está permitido para la categoría del producto'
            );
        }

        if ($estado === null) {
            continue;
        }

        if (!is_string($estado)) {
            throw new ErrorPerfilRecomendacion(
                'invalid_type',
                'El estado de cada uso debe ser una cadena o null'
            );
        }

        if (!in_array($estado, ['adecuado', 'no_recomendado'], true)) {
            throw new ErrorPerfilRecomendacion(
                'invalid_use',
                'El estado de uso debe ser adecuado o no_recomendado'
            );
        }

        $resultado[$uso] = $estado;
    }

    return $resultado;
}

/** @param array<string, array<string, mixed>> $esquemaAtributos
 *  @return array<string, mixed>
 */
function validarAtributosPerfilRecomendacion(mixed $atributos, array $esquemaAtributos): array
{
    if ($atributos === null) {
        return [];
    }

    if (!$atributos instanceof stdClass) {
        throw new ErrorPerfilRecomendacion(
            'invalid_type',
            'Los atributos deben ser un objeto JSON'
        );
    }

    $valores = get_object_vars($atributos);
    $desconocidos = array_diff(array_keys($valores), array_keys($esquemaAtributos));

    if ($desconocidos !== []) {
        throw new ErrorPerfilRecomendacion(
            'invalid_attribute',
            'El perfil contiene atributos no permitidos para la categoría del producto'
        );
    }

    $resultado = [];

    foreach ($valores as $atributo => $valor) {
        if ($valor === null) {
            $resultado[$atributo] = null;
            continue;
        }

        $resultado[$atributo] = validarValorAtributoPerfilRecomendacion(
            $atributo,
            $valor,
            $esquemaAtributos[$atributo]
        );
    }

    return $resultado;
}

/**
 * Valida un valor según su regla y lo devuelve normalizado (texto recortado, grado IP en
 * mayúsculas, lista sin duplicados). Un texto o una lista vacíos se guardan como null:
 * «sin dato», que el asistente nunca cuenta como cumplido.
 */
function validarValorAtributoPerfilRecomendacion(
    string $atributo,
    mixed $valor,
    array $regla
): mixed {
    switch ($regla['tipo']) {
        case 'string':
            if (!is_string($valor)) {
                throw new ErrorPerfilRecomendacion(
                    'invalid_type',
                    "El atributo {$atributo} debe ser texto o null"
                );
            }

            $valor = trim($valor);

            if ($valor === '') {
                return null;
            }

            if (contarCaracteresPerfilRecomendacion($valor) > $regla['maximo']) {
                throw new ErrorPerfilRecomendacion(
                    'invalid_value',
                    "El atributo {$atributo} supera la longitud permitida"
                );
            }

            return $valor;

        case 'numero_positivo':
        case 'entero_positivo':
            if (!is_int($valor) && !is_float($valor)) {
                throw new ErrorPerfilRecomendacion(
                    'invalid_type',
                    "El atributo {$atributo} debe ser numérico"
                );
            }

            if (
                !is_finite((float) $valor) ||
                $valor <= 0 ||
                $valor > $regla['maximo'] ||
                ($regla['tipo'] === 'entero_positivo' && !is_int($valor))
            ) {
                throw new ErrorPerfilRecomendacion(
                    'invalid_value',
                    "El atributo {$atributo} está fuera del rango permitido"
                );
            }

            return $valor;

        case 'enum':
            if (!is_string($valor)) {
                throw new ErrorPerfilRecomendacion(
                    'invalid_type',
                    "El atributo {$atributo} debe ser una cadena"
                );
            }

            if (!in_array($valor, $regla['valores'], true)) {
                throw new ErrorPerfilRecomendacion(
                    'invalid_value',
                    "El atributo {$atributo} no contiene un valor permitido"
                );
            }

            return $valor;

        case 'booleano':
            if (!is_bool($valor)) {
                throw new ErrorPerfilRecomendacion(
                    'invalid_type',
                    "El atributo {$atributo} debe ser true, false o null"
                );
            }

            return $valor;

        case 'lista':
            if (!is_array($valor) || !array_is_list($valor)) {
                throw new ErrorPerfilRecomendacion(
                    'invalid_type',
                    "El atributo {$atributo} debe ser una lista JSON"
                );
            }

            if ($valor === []) {
                return null;
            }

            $normalizados = [];

            foreach ($valor as $elemento) {
                if (!is_string($elemento)) {
                    throw new ErrorPerfilRecomendacion(
                        'invalid_type',
                        "Los valores de {$atributo} deben ser cadenas"
                    );
                }

                if (!in_array($elemento, $regla['valores'], true)) {
                    throw new ErrorPerfilRecomendacion(
                        'invalid_value',
                        "El atributo {$atributo} contiene un valor no permitido"
                    );
                }

                if (!in_array($elemento, $normalizados, true)) {
                    $normalizados[] = $elemento;
                }
            }

            return $normalizados;

        case 'resistencia_ip':
            if (!is_string($valor)) {
                throw new ErrorPerfilRecomendacion(
                    'invalid_type',
                    "El atributo {$atributo} debe ser una cadena o null"
                );
            }

            $valor = strtoupper(trim($valor));

            if ($valor === '') {
                return null;
            }

            if (!preg_match('/\A(?:IP[0-6](?:[0-9]|X)|IPX[0-9]|IP69K)\z/', $valor)) {
                throw new ErrorPerfilRecomendacion(
                    'invalid_value',
                    "El atributo {$atributo} debe usar un grado IP válido, como IP57 o IPX4"
                );
            }

            return $valor;
    }

    throw new LogicException('Tipo de atributo de perfil no configurado');
}

/** Caracteres UTF-8, no bytes; con UTF-8 inválido el texto se considera demasiado largo. */
function contarCaracteresPerfilRecomendacion(string $valor): int
{
    $cantidad = preg_match_all('/./us', $valor);

    return $cantidad === false ? PHP_INT_MAX : $cantidad;
}

/**
 * Valida el perfil con la categoría que el producto tiene en la BD (nunca con la que
 * envíe el cliente) y lo guarda. Debe llamarse dentro de una transacción: FOR UPDATE
 * impide que la categoría cambie entre la validación y el guardado.
 */
function guardarPerfilRecomendacion(PDO $pdo, int $productoId, mixed $perfil): array
{
    $consulta = $pdo->prepare(
        'SELECT p.categoria_id, c.nombre AS categoria
         FROM productos p
         INNER JOIN categorias c ON c.id = p.categoria_id
         WHERE p.id = :producto_id
         FOR UPDATE'
    );
    $consulta->execute([':producto_id' => $productoId]);
    $producto = $consulta->fetch(PDO::FETCH_ASSOC);

    if (!$producto) {
        throw new ErrorPerfilRecomendacion(
            'product_not_found',
            'No existe el producto indicado',
            404
        );
    }

    $perfilValidado = validarPerfilRecomendacion($perfil, (string) $producto['categoria']);
    $usosJson = json_encode(
        (object) $perfilValidado['usos'],
        JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
    );
    $atributosJson = json_encode(
        (object) $perfilValidado['atributos'],
        JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
    );

    $guardar = $pdo->prepare(
        'INSERT INTO perfil_recomendacion_producto
            (producto_id, categoria_id, usos, atributos)
         VALUES (:producto_id, :categoria_id, :usos, :atributos)
         ON DUPLICATE KEY UPDATE
            categoria_id = VALUES(categoria_id),
            usos = VALUES(usos),
            atributos = VALUES(atributos)'
    );
    $guardar->execute([
        ':producto_id' => $productoId,
        ':categoria_id' => (int) $producto['categoria_id'],
        ':usos' => $usosJson,
        ':atributos' => $atributosJson,
    ]);

    return [
        'producto_id' => $productoId,
        'categoria_id' => (int) $producto['categoria_id'],
        'categoria' => (string) $producto['categoria'],
        'usos' => (object) $perfilValidado['usos'],
        'atributos' => (object) $perfilValidado['atributos'],
    ];
}

/** Responde un error del perfil con el formato {error: {code, message}} que espera el panel. */
function enviarErrorPerfilRecomendacion(
    string $codigo,
    string $mensaje,
    int $estadoHttp
): never {
    http_response_code($estadoHttp);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        ['error' => ['code' => $codigo, 'message' => $mensaje]],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}
