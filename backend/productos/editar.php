<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once '../config/auth.php';

exigirAdministrador();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);

    echo json_encode([
        'error' => 'Método no permitido'
    ]);

    exit;
}

$datos = json_decode(
    file_get_contents('php://input'),
    true
);

if (
    !isset($datos['id']) ||
    !isset($datos['nombre']) ||
    !isset($datos['descripcion']) ||
    !isset($datos['precio']) ||
    !isset($datos['stock']) ||
    !isset($datos['categoria_id'])
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Faltan datos obligatorios'
    ]);

    exit;
}

$id = (int) $datos['id'];
$nombre = trim($datos['nombre']);
$descripcion = trim($datos['descripcion']);
$precio = (float) $datos['precio'];
$stock = (int) $datos['stock'];
$categoriaId = (int) $datos['categoria_id'];

$imagen = null;

if (isset($datos['imagen'])) {
    $imagen = trim($datos['imagen']);

    if ($imagen === '') {
        $imagen = null;
    }
}

if (
    $id <= 0 ||
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

    // Comprobar que el producto existe
    $sqlProducto = "
        SELECT id
        FROM productos
        WHERE id = :id
        LIMIT 1
    ";

    $stmtProducto = $pdo->prepare($sqlProducto);

    $stmtProducto->execute([
        ':id' => $id
    ]);

    $producto = $stmtProducto->fetch(PDO::FETCH_ASSOC);

    if (!$producto) {
        http_response_code(404);

        echo json_encode([
            'error' => 'Producto no encontrado'
        ]);

        exit;
    }

    // Comprobar que la categoría existe
    $sqlCategoria = "
        SELECT id
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
        http_response_code(404);

        echo json_encode([
            'error' => 'La categoría no existe'
        ]);

        exit;
    }

    // Actualizar producto
    $sql = "
        UPDATE productos
        SET
            nombre = :nombre,
            descripcion = :descripcion,
            precio = :precio,
            stock = :stock,
            imagen = :imagen,
            categoria_id = :categoria_id
        WHERE id = :id
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':nombre' => $nombre,
        ':descripcion' => $descripcion,
        ':precio' => $precio,
        ':stock' => $stock,
        ':imagen' => $imagen,
        ':categoria_id' => $categoriaId,
        ':id' => $id
    ]);

    echo json_encode([
        'mensaje' => 'Producto actualizado correctamente'
    ]);

} catch (PDOException $error) {

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al actualizar el producto'
    ]);
}