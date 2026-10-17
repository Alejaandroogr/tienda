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
require_once __DIR__ . '/estados_pedido.php';

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

if ($pedidoId <= 0) {
    http_response_code(400);

    echo json_encode([
        'error' => 'ID de pedido no válido'
    ]);

    exit;
}

if (!estadoPedidoValido($estado)) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Estado no válido'
    ]);

    exit;
}

try {

    $pdo->beginTransaction();

    // Se bloquea el pedido para que dos cambios simultáneos no repongan el stock dos veces.
    $stmtPedido = $pdo->prepare('SELECT id, estado FROM pedidos WHERE id = :pedido_id LIMIT 1 FOR UPDATE');
    $stmtPedido->execute([':pedido_id' => $pedidoId]);
    $pedido = $stmtPedido->fetch(PDO::FETCH_ASSOC);

    if (!$pedido) {
        $pdo->rollBack();
        http_response_code(404);

        echo json_encode([
            'error' => 'Pedido no encontrado'
        ]);

        exit;
    }

    $motivo = motivoTransicionPedidoNoPermitida((string) $pedido['estado'], $estado);

    if ($motivo !== null) {
        $pdo->rollBack();
        http_response_code(409);

        echo json_encode([
            'error' => $motivo
        ]);

        exit;
    }

    $stmt = $pdo->prepare('UPDATE pedidos SET estado = :estado WHERE id = :pedido_id');
    $stmt->execute([
        ':estado' => $estado,
        ':pedido_id' => $pedidoId
    ]);

    // Cancelar devuelve al stock las unidades de cada línea, en la misma transacción.
    $unidadesRepuestas = 0;

    if ($estado === 'cancelado') {
        $stmtLineas = $pdo->prepare('SELECT producto_id, cantidad FROM detalle_pedido WHERE pedido_id = :pedido_id');
        $stmtLineas->execute([':pedido_id' => $pedidoId]);
        $stmtStock = $pdo->prepare('UPDATE productos SET stock = stock + :cantidad WHERE id = :producto_id');

        foreach ($stmtLineas->fetchAll(PDO::FETCH_ASSOC) as $linea) {
            $stmtStock->execute([
                ':cantidad' => (int) $linea['cantidad'],
                ':producto_id' => (int) $linea['producto_id']
            ]);

            if ($stmtStock->rowCount() !== 1) {
                throw new RuntimeException('No se encontró el producto ' . $linea['producto_id'] . ' al reponer el stock');
            }

            $unidadesRepuestas += (int) $linea['cantidad'];
        }
    }

    $pdo->commit();

    echo json_encode([
        'mensaje' => $estado === 'cancelado'
            ? 'Pedido cancelado y stock repuesto correctamente'
            : 'Estado del pedido actualizado correctamente',
        'estado' => $estado,
        'unidades_repuestas' => $unidadesRepuestas
    ]);

} catch (Throwable $error) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('No se pudo cambiar el estado del pedido ' . $pedidoId . ': ' . $error->getMessage());
    http_response_code(500);

    echo json_encode([
        'error' => 'Error al actualizar el estado del pedido'
    ]);
}
