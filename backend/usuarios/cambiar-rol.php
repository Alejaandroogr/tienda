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
    !isset($datos['id']) ||
    !isset($datos['rol'])
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Faltan datos obligatorios'
    ]);

    exit;
}

$usuarioId = (int) $datos['id'];
$rol = trim($datos['rol']);

if ($usuarioId <= 0) {
    http_response_code(400);

    echo json_encode([
        'error' => 'El usuario no es válido'
    ]);

    exit;
}

if (
    $rol !== 'cliente' &&
    $rol !== 'admin'
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'El rol no es válido'
    ]);

    exit;
}

iniciarSesion();

$usuarioActualId =
    (int) $_SESSION['usuario_id'];

if ($usuarioId === $usuarioActualId) {
    http_response_code(400);

    echo json_encode([
        'error' => 'No puedes cambiar tu propio rol'
    ]);

    exit;
}

try {

    $sqlUsuario = "
        SELECT
            id,
            rol
        FROM usuarios
        WHERE id = :id
        LIMIT 1
    ";

    $stmtUsuario =
        $pdo->prepare($sqlUsuario);

    $stmtUsuario->execute([
        ':id' => $usuarioId
    ]);

    $usuario =
        $stmtUsuario->fetch(
            PDO::FETCH_ASSOC
        );

    if (!$usuario) {
        http_response_code(404);

        echo json_encode([
            'error' => 'Usuario no encontrado'
        ]);

        exit;
    }

    $sql = "
        UPDATE usuarios
        SET rol = :rol
        WHERE id = :id
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':rol' => $rol,
        ':id' => $usuarioId
    ]);

    echo json_encode([
        'mensaje' => 'Rol actualizado correctamente',
        'usuario_id' => $usuarioId,
        'rol' => $rol
    ]);

} catch (PDOException $error) {

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al cambiar el rol del usuario'
    ]);
}