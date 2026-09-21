<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/database.php';

if (!isset($_GET['id'])) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Falta el ID del producto'
    ]);

    exit;
}

$id = (int) $_GET['id'];

$sql = "SELECT 
            p.id,
            p.nombre,
            p.descripcion,
            p.precio,
            p.stock,
            p.imagen,
            c.nombre AS categoria
        FROM productos p
        INNER JOIN categorias c 
            ON p.categoria_id = c.id
        WHERE p.id = :id";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    ':id' => $id
]);

$producto = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$producto) {
    http_response_code(404);

    echo json_encode([
        'error' => 'Producto no encontrado'
    ]);

    exit;
}

echo json_encode($producto);