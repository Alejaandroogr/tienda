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
            id,
            nombre,
            email,
            rol,
            creado_en
        FROM usuarios
        ORDER BY creado_en DESC
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute();

    $usuarios = $stmt->fetchAll(
        PDO::FETCH_ASSOC
    );

    echo json_encode($usuarios);

} catch (PDOException $error) {

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al obtener los usuarios'
    ]);
}