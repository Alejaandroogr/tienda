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

$nombreRecibido = campoTextoSolicitud($datos, 'nombre');
$emailRecibido = campoTextoSolicitud($datos, 'email');
$password = campoTextoSolicitud($datos, 'password');

if (
    $nombreRecibido === null ||
    $emailRecibido === null ||
    $password === null
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Faltan datos obligatorios'
    ]);

    exit;
}

$nombre = trim($nombreRecibido);
$email = trim($emailRecibido);

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

// Límites del registro. El login no los aplica: los usuarios existentes con
// contraseñas más cortas pueden seguir entrando.
$errorRegistro = match (true) {
    mb_strlen($nombre, 'UTF-8') > 100 => 'El nombre admite como máximo 100 caracteres',
    strlen($email) > 150 || filter_var($email, FILTER_VALIDATE_EMAIL) === false => 'El correo electrónico no es válido',
    mb_strlen($password, 'UTF-8') < 8 => 'La contraseña debe tener al menos 8 caracteres',
    // bcrypt (PASSWORD_DEFAULT) ignora lo que pasa de 72 bytes.
    strlen($password) > 72 => 'La contraseña admite como máximo 72 caracteres',
    default => null,
};

if ($errorRegistro !== null) {
    http_response_code(400);

    echo json_encode([
        'error' => $errorRegistro
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