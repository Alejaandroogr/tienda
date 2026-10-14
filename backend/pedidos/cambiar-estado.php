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
    campoEnteroSolicitud($datos, 'pedido_id') === null ||
    campoTextoSolicitud($datos, 'estado') === null
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Faltan datos obligatorios'
    ]);

    exit;
}

$pedidoId = (int) $datos['pedido_id'];
$estado = trim($datos['estado']);

$estadosPermitidos = [
    'pendiente',
    'procesando',
    'enviado',
    'entregado',
    'cancelado'
];

if ($pedidoId <= 0) {
    http_response_code(400);

    echo json_encode([
        'error' => 'ID de pedido no válido'
    ]);

    exit;
}

if (!in_array($estado, $estadosPermitidos, true)) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Estado no válido'
    ]);

    exit;
}

try {

    // Comprobar que el pedido existe
    $sqlExiste = "
        SELECT id
        FROM pedidos
        WHERE id = :pedido_id
        LIMIT 1
    ";

    $stmtExiste = $pdo->prepare($sqlExiste);

    $stmtExiste->execute([
        ':pedido_id' => $pedidoId
    ]);

    $pedido = $stmtExiste->fetch(PDO::FETCH_ASSOC);

    if (!$pedido) {
        http_response_code(404);

        echo json_encode([
            'error' => 'Pedido no encontrado'
        ]);

        exit;
    }

    // Actualizar estado
    $sql = "
        UPDATE pedidos
        SET estado = :estado
        WHERE id = :pedido_id
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':estado' => $estado,
        ':pedido_id' => $pedidoId
    ]);

    echo json_encode([
        'mensaje' => 'Estado del pedido actualizado correctamente'
    ]);

} catch (PDOException $error) {

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al actualizar el estado del pedido'
    ]);
}