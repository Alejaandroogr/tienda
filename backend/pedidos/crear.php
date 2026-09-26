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

/*
 * Comprobar que existe una sesión.
 */
iniciarSesion();

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);

    echo json_encode([
        'error' => 'Debes iniciar sesión para realizar un pedido'
    ]);

    exit;
}

/*
 * El usuario se obtiene de la sesión.
 * No confiamos en un usuario_id enviado por React.
 */
$usuarioId = (int) $_SESSION['usuario_id'];

$datos = json_decode(
    file_get_contents('php://input'),
    true
);

if (
    !isset($datos['productos'])
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Faltan datos obligatorios'
    ]);

    exit;
}

$productos = $datos['productos'];

if (
    !is_array($productos) ||
    count($productos) === 0
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'El pedido no contiene productos'
    ]);

    exit;
}

try {

    $pdo->beginTransaction();

    /*
     * Comprobar que el usuario de la sesión existe.
     */
    $sqlUsuario = "
        SELECT id
        FROM usuarios
        WHERE id = :usuario_id
        LIMIT 1
    ";

    $stmtUsuario = $pdo->prepare($sqlUsuario);

    $stmtUsuario->execute([
        ':usuario_id' => $usuarioId
    ]);

    $usuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        $pdo->rollBack();

        http_response_code(404);

        echo json_encode([
            'error' => 'Usuario no encontrado'
        ]);

        exit;
    }

    $total = 0;
    $detalles = [];

    /*
     * Comprobar todos los productos y el stock.
     */
    foreach ($productos as $producto) {

        if (
            !isset($producto['producto_id']) ||
            !isset($producto['cantidad'])
        ) {
            $pdo->rollBack();

            http_response_code(400);

            echo json_encode([
                'error' => 'Producto del pedido no válido'
            ]);

            exit;
        }

        $productoId = (int) $producto['producto_id'];
        $cantidad = (int) $producto['cantidad'];

        if (
            $productoId <= 0 ||
            $cantidad <= 0
        ) {
            $pdo->rollBack();

            http_response_code(400);

            echo json_encode([
                'error' => 'Cantidad o producto no válido'
            ]);

            exit;
        }

        /*
         * FOR UPDATE bloquea la fila mientras se procesa
         * el pedido para evitar problemas de stock.
         */
        $sqlProducto = "
            SELECT
                id,
                precio,
                stock
            FROM productos
            WHERE id = :producto_id
            LIMIT 1
            FOR UPDATE
        ";

        $stmtProducto = $pdo->prepare($sqlProducto);

        $stmtProducto->execute([
            ':producto_id' => $productoId
        ]);

        $productoBD = $stmtProducto->fetch(PDO::FETCH_ASSOC);

        if (!$productoBD) {
            $pdo->rollBack();

            http_response_code(404);

            echo json_encode([
                'error' => 'Uno de los productos no existe'
            ]);

            exit;
        }

        $stock = (int) $productoBD['stock'];
        $precio = (float) $productoBD['precio'];

        if ($stock < $cantidad) {
            $pdo->rollBack();

            http_response_code(409);

            echo json_encode([
                'error' => 'No hay suficiente stock para uno de los productos'
            ]);

            exit;
        }

        $subtotal = $precio * $cantidad;

        $total += $subtotal;

        $detalles[] = [
            'producto_id' => $productoId,
            'cantidad' => $cantidad,
            'precio' => $precio
        ];
    }

    /*
     * Crear el pedido.
     */
    $sqlPedido = "
        INSERT INTO pedidos (
            usuario_id,
            total
        ) VALUES (
            :usuario_id,
            :total
        )
    ";

    $stmtPedido = $pdo->prepare($sqlPedido);

    $stmtPedido->execute([
        ':usuario_id' => $usuarioId,
        ':total' => $total
    ]);

    $pedidoId = (int) $pdo->lastInsertId();

    /*
     * Insertar los detalles.
     */
    $sqlDetalle = "
        INSERT INTO detalle_pedido (
            pedido_id,
            producto_id,
            cantidad,
            precio
        ) VALUES (
            :pedido_id,
            :producto_id,
            :cantidad,
            :precio
        )
    ";

    $stmtDetalle = $pdo->prepare($sqlDetalle);

    /*
     * Actualizar el stock.
     */
    $sqlStock = "
        UPDATE productos
        SET stock = stock - :cantidad
        WHERE id = :producto_id
    ";

    $stmtStock = $pdo->prepare($sqlStock);

    foreach ($detalles as $detalle) {

        $stmtDetalle->execute([
            ':pedido_id' => $pedidoId,
            ':producto_id' => $detalle['producto_id'],
            ':cantidad' => $detalle['cantidad'],
            ':precio' => $detalle['precio']
        ]);

        $stmtStock->execute([
            ':cantidad' => $detalle['cantidad'],
            ':producto_id' => $detalle['producto_id']
        ]);
    }

    $pdo->commit();

    echo json_encode([
        'mensaje' => 'Pedido creado correctamente',
        'pedido_id' => $pedidoId,
        'total' => number_format(
            $total,
            2,
            '.',
            ''
        )
    ]);

} catch (PDOException $error) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        'error' => 'Error al crear el pedido'
    ]);
}