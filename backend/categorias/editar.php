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
    campoEnteroSolicitud($datos, 'id') === null ||
    campoTextoSolicitud($datos, 'nombre') === null
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Faltan datos obligatorios'
    ]);

    exit;
}

$id = (int) $datos['id'];
$nombre = trim($datos['nombre']);

if ($id <= 0 || $nombre === '') {
    http_response_code(400);

    echo json_encode([
        'error' => 'Los datos de la categoría no son válidos'
    ]);

    exit;
}

try {

    $sqlExiste = "
        SELECT id
        FROM categorias
        WHERE id = :id
        LIMIT 1
    ";

    $stmtExiste = $pdo->prepare($sqlExiste);

    $stmtExiste->execute([
        ':id' => $id
    ]);

    $categoria = $stmtExiste->fetch(PDO::FETCH_ASSOC);

    if (!$categoria) {
        http_response_code(404);

        echo json_encode([
            'error' => 'Categoría no encontrada'
        ]);

        exit;
    }

    $sql = "
        UPDATE categorias
        SET nombre = :nombre
        WHERE id = :id
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':nombre' => $nombre,
        ':id' => $id
    ]);

    echo json_encode([
        'mensaje' => 'Categoría actualizada correctamente'
    ]);

} catch (PDOException $error) {

    if (
        isset($error->errorInfo[1]) &&
        $error->errorInfo[1] === 1062
    ) {
        http_response_code(409);

        echo json_encode([
            'error' => 'Ya existe una categoría con ese nombre'
        ]);

        exit;
    }

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al actualizar la categoría'
    ]);
}