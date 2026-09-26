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
    !isset($datos['email']) ||
    !isset($datos['password'])
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Faltan datos obligatorios'
    ]);

    exit;
}

$email = trim($datos['email']);
$password = $datos['password'];

if (
    $email === '' ||
    $password === ''
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Todos los campos son obligatorios'
    ]);

    exit;
}

$sql = "
    SELECT
        id,
        nombre,
        email,
        password,
        rol
    FROM usuarios
    WHERE email = :email
    LIMIT 1
";

try {

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':email' => $email
    ]);

    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        http_response_code(401);

        echo json_encode([
            'error' => 'Correo o contraseña incorrectos'
        ]);

        exit;
    }

    if (
        !password_verify(
            $password,
            $usuario['password']
        )
    ) {
        http_response_code(401);

        echo json_encode([
            'error' => 'Correo o contraseña incorrectos'
        ]);

        exit;
    }

    /*
     * Login correcto.
     *
     * Creamos una sesión PHP en el servidor.
     */
    iniciarSesion();

    session_regenerate_id(true);

    $_SESSION['usuario_id'] = (int) $usuario['id'];
    $_SESSION['usuario_nombre'] = $usuario['nombre'];
    $_SESSION['usuario_email'] = $usuario['email'];
    $_SESSION['usuario_rol'] = $usuario['rol'];

    unset($usuario['password']);

    echo json_encode([
        'mensaje' => 'Inicio de sesión correcto',
        'usuario' => $usuario
    ]);

} catch (PDOException $error) {

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al iniciar sesión'
    ]);
}