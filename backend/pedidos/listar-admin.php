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

exigirAdministrador();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);

    echo json_encode([
        'error' => 'Método no permitido'
    ]);

    exit;
}

try {

    $sql = "
        SELECT
            p.id,
            p.usuario_id,
            u.nombre AS usuario_nombre,
            u.email AS usuario_email,
            p.total,
            p.estado,
            p.creado_en
        FROM pedidos p
        INNER JOIN usuarios u
            ON p.usuario_id = u.id
        ORDER BY p.creado_en DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($pedidos);

} catch (PDOException $error) {

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al obtener los pedidos'
    ]);
}