<?php

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

$sql = "
    SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.stock,
        p.imagen,
        c.nombre AS categoria
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    ORDER BY p.id DESC
";

$stmt = $pdo->query($sql);

echo json_encode($stmt->fetchAll());