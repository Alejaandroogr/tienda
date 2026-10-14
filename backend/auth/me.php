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

// Datos actuales de la BD: un cambio de rol o un borrado se refleja sin nuevo login.
$usuario = refrescarUsuarioSesion($pdo);

if ($usuario === null) {
    http_response_code(401);

    echo json_encode([
        'autenticado' => false,
        'error' => 'No hay una sesión activa'
    ]);

    exit;
}

echo json_encode([
    'autenticado' => true,
    'usuario' => $usuario
]);