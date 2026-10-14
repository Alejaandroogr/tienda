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

require_once '../config/database.php';
require_once '../config/auth.php';

exigirAdministrador();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

if (campoTextoSolicitud($datos, 'nombre') === null) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Falta el nombre de la categoría'
    ]);

    exit;
}

$nombre = trim($datos['nombre']);

if ($nombre === '') {
    http_response_code(400);

    echo json_encode([
        'error' => 'El nombre de la categoría es obligatorio'
    ]);

    exit;
}

try {

    $sql = "
        INSERT INTO categorias (
            nombre
        ) VALUES (
            :nombre
        )
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':nombre' => $nombre
    ]);

    $categoriaId = (int) $pdo->lastInsertId();

    echo json_encode([
        'mensaje' => 'Categoría creada correctamente',
        'categoria_id' => $categoriaId
    ]);

} catch (PDOException $error) {

    if (
        isset($error->errorInfo[1]) &&
        $error->errorInfo[1] === 1062
    ) {
        http_response_code(409);

        echo json_encode([
            'error' => 'La categoría ya existe'
        ]);

        exit;
    }

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al crear la categoría'
    ]);
}