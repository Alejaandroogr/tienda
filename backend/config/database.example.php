<?php

$host = '127.0.0.1';
$db = 'tienda';
$user = 'root';
$password = 'TU_CONTRASEÑA'; // Aqui poner la contraseña que quieras usar

require_once __DIR__ . '/database_connection.php';

$pdo = crearConexionBaseDatos(
    $host,
    $db,
    $user,
    $password,
    $databaseFailureMode ?? 'die'
);
