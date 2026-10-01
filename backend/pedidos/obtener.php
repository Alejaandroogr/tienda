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

if (!isset($_GET['id'])) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Falta el ID del pedido'
    ]);

    exit;
}

$pedidoId = (int) $_GET['id'];

if ($pedidoId <= 0) {
    http_response_code(400);

    echo json_encode([
        'error' => 'ID de pedido no válido'
    ]);

    exit;
}

try {

    /*
     * Obtenemos el pedido únicamente si pertenece
     * al usuario que tiene la sesión iniciada.
     */
    $sqlPedido = "
        SELECT
            p.id,
            p.usuario_id,
            p.total,
            p.estado,
            p.creado_en
        FROM pedidos p
        WHERE p.id = :pedido_id
        AND p.usuario_id = :usuario_id
        LIMIT 1
    ";

    $stmtPedido = $pdo->prepare($sqlPedido);

    $stmtPedido->execute([
        ':pedido_id' => $pedidoId,
        ':usuario_id' => $usuarioId
    ]);

    $pedido = $stmtPedido->fetch(PDO::FETCH_ASSOC);

    if (!$pedido) {
        $stmtExistencia = $pdo->prepare(
            'SELECT id FROM pedidos WHERE id = :pedido_id LIMIT 1'
        );

        $stmtExistencia->execute([
            ':pedido_id' => $pedidoId
        ]);

        $pedidoExiste = $stmtExistencia->fetch(PDO::FETCH_ASSOC);

        if ($pedidoExiste) {
            http_response_code(403);

            echo json_encode([
                'error' => 'No tienes permiso para consultar este pedido'
            ]);

            exit;
        }

        http_response_code(404);

        echo json_encode([
            'error' => 'Pedido no encontrado'
        ]);

        exit;
    }

    /*
     * Obtener los productos del pedido.
     */
    $sqlDetalles = "
        SELECT
            dp.id,
            dp.producto_id,
            p.nombre,
            p.imagen,
            dp.cantidad,
            dp.precio
        FROM detalle_pedido dp
        INNER JOIN productos p
            ON dp.producto_id = p.id
        WHERE dp.pedido_id = :pedido_id
        ORDER BY dp.id ASC
    ";

    $stmtDetalles = $pdo->prepare($sqlDetalles);

    $stmtDetalles->execute([
        ':pedido_id' => $pedidoId
    ]);

    $detalles = $stmtDetalles->fetchAll(PDO::FETCH_ASSOC);

    /*
     * Devolver pedido + productos.
     */
    echo json_encode([
        'pedido' => $pedido,
        'detalles' => $detalles
    ]);

} catch (PDOException $error) {

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al obtener el pedido'
    ]);
}
