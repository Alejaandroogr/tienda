<?php

/**
 * Crea la conexión PDO compartida por los endpoints del backend.
 * El modo predeterminado conserva la respuesta die() histórica.
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

        die('Error de conexión: ' . $error->getMessage());
    }
}
