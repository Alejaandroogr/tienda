<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

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

if (
    !isset($datos['nombre']) ||
    !isset($datos['email']) ||
    !isset($datos['password'])
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Faltan datos obligatorios'
    ]);

    exit;
}

$nombre = trim($datos['nombre']);
$email = trim($datos['email']);
$password = $datos['password'];

if (
    $nombre === '' ||
    $email === '' ||
    $password === ''
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Todos los campos son obligatorios'
    ]);

    exit;
}

$passwordHash = password_hash(
    $password,
    PASSWORD_DEFAULT
);

$sql = "INSERT INTO usuarios (
            nombre,
            email,
            password
        ) VALUES (
            :nombre,
            :email,
            :password
        )";

try {
    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':nombre' => $nombre,
        ':email' => $email,
        ':password' => $passwordHash
    ]);

    echo json_encode([
        'mensaje' => 'Usuario registrado correctamente'
    ]);

} catch (PDOException $error) {

    if (
        isset($error->errorInfo[1]) &&
        $error->errorInfo[1] === 1062
    ) {
        http_response_code(409);

        echo json_encode([
            'error' => 'El correo electrónico ya está registrado'
        ]);

        exit;
    }

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al registrar el usuario'
    ]);
}