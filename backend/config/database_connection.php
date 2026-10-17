<?php

require_once __DIR__ . '/errores.php';

/**
 * Crea la conexión PDO compartida por los endpoints del backend.
 * En el modo predeterminado, un fallo de conexión responde con un error JSON
 * genérico; el detalle (host, usuario, SQLSTATE) solo se registra en el log.
 */
function crearConexionBaseDatos(
    string $host,
    string $baseDatos,
    string $usuario,
    string $contrasena,
    string $modoError = 'die'
): PDO {
    try {
        return new PDO(
            "mysql:host=$host;port=3306;dbname=$baseDatos;charset=utf8mb4",
            $usuario,
            $contrasena,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 3,
            ]
        );
    } catch (PDOException $error) {
        if ($modoError === 'exception') {
            throw $error;
        }

        error_log('Error de conexión a la base de datos: ' . $error->getMessage());

        if (!headers_sent()) {
            http_response_code(503);
            header('Content-Type: application/json; charset=utf-8');
        }

        echo json_encode(['error' => 'Servicio no disponible temporalmente'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
