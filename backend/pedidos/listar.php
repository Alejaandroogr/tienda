<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once '../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);

    echo json_encode([
        'error' => 'Método no permitido'
    ]);

    exit;
}

iniciarSesion();

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);

    echo json_encode([
        'error' => 'Debes iniciar sesión'
    ]);

    exit;
}

$usuarioId = (int) $_SESSION['usuario_id'];

try {

    $sql = "
        SELECT
            p.id,
            p.usuario_id,
            p.total,
            p.estado,
            p.creado_en
        FROM pedidos p
        WHERE p.usuario_id = :usuario_id
        ORDER BY p.creado_en DESC
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':usuario_id' => $usuarioId
    ]);

    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($pedidos);

} catch (PDOException $error) {

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al obtener los pedidos'
    ]);
}