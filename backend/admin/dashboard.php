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

    // Total de usuarios
    $stmtUsuarios = $pdo->query("
        SELECT COUNT(*) AS total
        FROM usuarios
    ");

    $totalUsuarios = (int) $stmtUsuarios->fetchColumn();


    // Total de productos
    $stmtProductos = $pdo->query("
        SELECT COUNT(*) AS total
        FROM productos
    ");

    $totalProductos = (int) $stmtProductos->fetchColumn();


    // Total de pedidos
    $stmtPedidos = $pdo->query("
        SELECT COUNT(*) AS total
        FROM pedidos
    ");

    $totalPedidos = (int) $stmtPedidos->fetchColumn();


    // Total vendido
    // Los pedidos cancelados no cuentan como ventas
    $stmtVentas = $pdo->query("
        SELECT COALESCE(SUM(total), 0)
        FROM pedidos
        WHERE estado != 'cancelado'
    ");

    $totalVentas = (float) $stmtVentas->fetchColumn();


    // Pedidos pendientes
    $stmtPendientes = $pdo->query("
        SELECT COUNT(*)
        FROM pedidos
        WHERE estado = 'pendiente'
    ");

    $pedidosPendientes = (int) $stmtPendientes->fetchColumn();


    // Pedidos procesando
    $stmtProcesando = $pdo->query("
        SELECT COUNT(*)
        FROM pedidos
        WHERE estado = 'procesando'
    ");

    $pedidosProcesando = (int) $stmtProcesando->fetchColumn();


    // Pedidos enviados
    $stmtEnviados = $pdo->query("
        SELECT COUNT(*)
        FROM pedidos
        WHERE estado = 'enviado'
    ");

    $pedidosEnviados = (int) $stmtEnviados->fetchColumn();


    // Pedidos entregados
    $stmtEntregados = $pdo->query("
        SELECT COUNT(*)
        FROM pedidos
        WHERE estado = 'entregado'
    ");

    $pedidosEntregados = (int) $stmtEntregados->fetchColumn();


    // Pedidos cancelados
    $stmtCancelados = $pdo->query("
        SELECT COUNT(*)
        FROM pedidos
        WHERE estado = 'cancelado'
    ");

    $pedidosCancelados = (int) $stmtCancelados->fetchColumn();


    echo json_encode([
        'usuarios' => [
            'total' => $totalUsuarios
        ],

        'productos' => [
            'total' => $totalProductos
        ],

        'pedidos' => [
            'total' => $totalPedidos,
            'pendientes' => $pedidosPendientes,
            'procesando' => $pedidosProcesando,
            'enviados' => $pedidosEnviados,
            'entregados' => $pedidosEntregados,
            'cancelados' => $pedidosCancelados
        ],

        'ventas' => [
            'total' => number_format(
                $totalVentas,
                2,
                '.',
                ''
            )
        ]
    ]);

} catch (PDOException $error) {

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al obtener las estadísticas'
    ]);
}