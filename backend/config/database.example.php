<?php

$host = '127.0.0.1';
$db = 'tienda';
$user = 'root';
$password = 'TU_CONTRASEÑA'; // Aqui poner la contraseña que quieras usar

try {
    $pdo = new PDO(
        "mysql:host=$host;port=3306;dbname=$db;charset=utf8mb4",
        $user,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}