<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/perfil_recomendacion.php';

exigirAdministrador();

$metodo = $_SERVER['REQUEST_METHOD'] ?? '';

if ($metodo === 'GET') {
    $productoId = filter_var(
        $_GET['producto_id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    if ($productoId === false || $productoId === null) {
        enviarErrorPerfilRecomendacion(
            'invalid_request',
            'Indica un producto_id válido',
            400
        );
    }

    try {
        $consulta = $pdo->prepare(
            'SELECT p.id AS producto_id, p.categoria_id, c.nombre AS categoria,
                    r.categoria_id AS perfil_categoria_id, r.usos, r.atributos
             FROM productos p
             INNER JOIN categorias c ON c.id = p.categoria_id
             LEFT JOIN perfil_recomendacion_producto r ON r.producto_id = p.id
             WHERE p.id = :producto_id'
        );
        $consulta->execute([':producto_id' => $productoId]);
        $fila = $consulta->fetch(PDO::FETCH_ASSOC);

        if (!$fila) {
            enviarErrorPerfilRecomendacion(
                'product_not_found',
                'No existe el producto indicado',
                404
            );
        }

        $tienePerfil = $fila['usos'] !== null && $fila['atributos'] !== null;

        if (
            $tienePerfil &&
            (int) $fila['perfil_categoria_id'] !== (int) $fila['categoria_id']
        ) {
            enviarErrorPerfilRecomendacion(
                'category_profile_mismatch',
                'El perfil almacenado no coincide con la categoría actual del producto',
                409
            );
        }

        $usos = $tienePerfil ? json_decode((string) $fila['usos']) : new stdClass();
        $atributos = $tienePerfil
            ? json_decode((string) $fila['atributos'])
            : new stdClass();

        if (!$usos instanceof stdClass || !$atributos instanceof stdClass) {
            throw new RuntimeException('El perfil almacenado no tiene un formato JSON válido');
        }

        echo json_encode([
            'producto_id' => (int) $fila['producto_id'],
            'categoria_id' => (int) $fila['categoria_id'],
            'categoria' => (string) $fila['categoria'],
            'perfil_ia' => [
                'usos' => $usos,
                'atributos' => $atributos,
            ],
            'existe_perfil' => $tienePerfil,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    } catch (Throwable $error) {
        error_log('No se pudo consultar el perfil IA: ' . $error->getMessage());
        enviarErrorPerfilRecomendacion(
            'profile_unavailable',
            'No se pudo consultar el perfil IA',
            500
        );
    }

    exit;
}

if ($metodo !== 'PUT') {
    header('Allow: GET, PUT, OPTIONS');
    enviarErrorPerfilRecomendacion(
        'method_not_allowed',
        'Método no permitido',
        405
    );
}

$cuerpo = file_get_contents('php://input');

if ($cuerpo === false || strlen($cuerpo) > 65536) {
    enviarErrorPerfilRecomendacion(
        'request_too_large',
        'La solicitud es demasiado grande',
        413
    );
}

try {
    $datos = json_decode($cuerpo, false, 32, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    enviarErrorPerfilRecomendacion(
        'invalid_json',
        'El cuerpo de la solicitud no contiene JSON válido',
        400
    );
}

if (!$datos instanceof stdClass) {
    enviarErrorPerfilRecomendacion(
        'invalid_type',
        'La solicitud debe ser un objeto JSON',
        400
    );
}

$campos = get_object_vars($datos);
$desconocidos = array_diff(array_keys($campos), ['producto_id', 'usos', 'atributos']);

if ($desconocidos !== []) {
    $codigo = in_array('categoria_id', $desconocidos, true)
        ? 'category_profile_mismatch'
        : 'invalid_request';
    enviarErrorPerfilRecomendacion(
        $codigo,
        'La solicitud contiene campos que no puede establecer el cliente',
        400
    );
}

if (
    !array_key_exists('producto_id', $campos) ||
    !is_int($campos['producto_id']) ||
    $campos['producto_id'] <= 0
) {
    enviarErrorPerfilRecomendacion(
        'invalid_request',
        'Indica un producto_id entero válido',
        400
    );
}

try {
    $pdo->beginTransaction();
    $perfilGuardado = guardarPerfilRecomendacion(
        $pdo,
        $campos['producto_id'],
        (object) [
            'usos' => $campos['usos'] ?? new stdClass(),
            'atributos' => $campos['atributos'] ?? new stdClass(),
        ]
    );
    $pdo->commit();

    echo json_encode(
        ['perfil_ia' => $perfilGuardado],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
    );
} catch (ErrorPerfilRecomendacion $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    enviarErrorPerfilRecomendacion(
        $error->codigo,
        $error->getMessage(),
        $error->estadoHttp
    );
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('No se pudo guardar el perfil IA: ' . $error->getMessage());
    enviarErrorPerfilRecomendacion(
        'profile_save_failed',
        'No se pudo guardar el perfil IA',
        500
    );
}
