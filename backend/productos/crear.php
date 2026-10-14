<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/perfil_recomendacion.php';

exigirAdministrador();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'error' => 'Método no permitido'
    ]);

    exit;
}

$cuerpo = file_get_contents('php://input');

try {
    $datosJson = json_decode($cuerpo === false ? '' : $cuerpo, false, 32, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    enviarErrorPerfilRecomendacion('invalid_json', 'El cuerpo no contiene JSON válido', 400);
}

if (!$datosJson instanceof stdClass) {
    enviarErrorPerfilRecomendacion('invalid_type', 'La solicitud debe ser un objeto JSON', 400);
}

$datos = get_object_vars($datosJson);
$camposPermitidos = [
    'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'categoria_id', 'perfil_ia',
];

if (array_diff(array_keys($datos), $camposPermitidos) !== []) {
    enviarErrorPerfilRecomendacion(
        'invalid_request',
        'La solicitud contiene campos no permitidos',
        400
    );
}

if (
    !isset($datos['nombre']) || !is_string($datos['nombre']) ||
    !isset($datos['descripcion']) || !is_string($datos['descripcion']) ||
    !isset($datos['precio']) || (!is_string($datos['precio']) && !is_int($datos['precio']) && !is_float($datos['precio'])) ||
    !isset($datos['stock']) || (!is_string($datos['stock']) && !is_int($datos['stock'])) ||
    !isset($datos['categoria_id']) || (!is_string($datos['categoria_id']) && !is_int($datos['categoria_id']))
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Faltan datos obligatorios'
    ]);

    exit;
}

$nombre = trim($datos['nombre']);
$descripcion = trim($datos['descripcion']);
$precio = (float) $datos['precio'];
$stock = (int) $datos['stock'];
$categoriaId = (int) $datos['categoria_id'];

if (array_key_exists('perfil_ia', $datos) && $datos['perfil_ia'] !== null && !$datos['perfil_ia'] instanceof stdClass) {
    enviarErrorPerfilRecomendacion('invalid_type', 'perfil_ia debe ser un objeto JSON o null', 400);
}

if (array_key_exists('imagen', $datos) && $datos['imagen'] !== null && !is_string($datos['imagen'])) {
    enviarErrorPerfilRecomendacion('invalid_type', 'imagen debe ser texto o null', 400);
}

$imagen = null;

if (isset($datos['imagen'])) {
    $imagen = trim($datos['imagen']);

    if ($imagen === '') {
        $imagen = null;
    }
}

if (
    $nombre === '' ||
    $descripcion === '' ||
    $precio < 0 ||
    $stock < 0 ||
    $categoriaId <= 0
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Los datos del producto no son válidos'
    ]);

    exit;
}

try {

    $pdo->beginTransaction();

    // La categoría del producto se valida en MariaDB; perfil_ia no suministra su categoría.
    $sqlCategoria = "
        SELECT id, nombre
        FROM categorias
        WHERE id = :categoria_id
        LIMIT 1
    ";

    $stmtCategoria = $pdo->prepare($sqlCategoria);

    $stmtCategoria->execute([
        ':categoria_id' => $categoriaId
    ]);

    $categoria = $stmtCategoria->fetch(PDO::FETCH_ASSOC);

    if (!$categoria) {
        throw new ErrorPerfilRecomendacion(
            'invalid_category',
            'La categoría del producto no existe',
            422
        );
    }

    // Crear producto
    $sql = "
        INSERT INTO productos (
            nombre,
            descripcion,
            precio,
            stock,
            imagen,
            categoria_id
        ) VALUES (
            :nombre,
            :descripcion,
            :precio,
            :stock,
            :imagen,
            :categoria_id
        )
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':nombre' => $nombre,
        ':descripcion' => $descripcion,
        ':precio' => $precio,
        ':stock' => $stock,
        ':imagen' => $imagen,
        ':categoria_id' => $categoriaId
    ]);

    $productoId = (int) $pdo->lastInsertId();

    $accionPerfil = planificarPerfilProductoRecomendacion(
        array_key_exists('perfil_ia', $datos) && $datos['perfil_ia'] !== null,
        $datos['perfil_ia'] ?? null,
        categoriaAdmitePerfilRecomendacion((string) $categoria['nombre']),
        false
    );

    if ($accionPerfil === 'guardar') {
        guardarPerfilRecomendacion($pdo, $productoId, $datos['perfil_ia']);
    }

    $pdo->commit();

    echo json_encode([
        'mensaje' => 'Producto creado correctamente',
        'producto_id' => $productoId
    ]);

} catch (ErrorPerfilRecomendacion $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    enviarErrorPerfilRecomendacion($error->codigo, $error->getMessage(), $error->estadoHttp);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('No se pudo crear el producto: ' . $error->getMessage());
    if (array_key_exists('perfil_ia', $datos)) {
        enviarErrorPerfilRecomendacion('profile_save_failed', 'No se pudo guardar el producto y su perfil IA', 500);
    }

    http_response_code(500);
    echo json_encode(['error' => 'Error al crear el producto']);
}
