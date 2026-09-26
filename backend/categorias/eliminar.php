<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once '../config/auth.php';

exigirAdministrador();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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

if (!isset($datos['id'])) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Falta el ID de la categoría'
    ]);

    exit;
}

$id = (int) $datos['id'];

if ($id <= 0) {
    http_response_code(400);

    echo json_encode([
        'error' => 'ID de categoría no válido'
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
        DELETE FROM categorias
        WHERE id = :id
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':id' => $id
    ]);

    echo json_encode([
        'mensaje' => 'Categoría eliminada correctamente'
    ]);

} catch (PDOException $error) {

    http_response_code(409);

    echo json_encode([
        'error' => 'No se puede eliminar la categoría porque tiene productos asociados'
    ]);
}