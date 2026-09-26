<?php

function iniciarSesion(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function exigirAdministrador(): void
{
    iniciarSesion();

    if (!isset($_SESSION['usuario_id'])) {
        http_response_code(401);

        echo json_encode([
            'error' => 'No has iniciado sesión'
        ]);

        exit;
    }

    if (
        !isset($_SESSION['usuario_rol']) ||
        $_SESSION['usuario_rol'] !== 'admin'
    ) {
        http_response_code(403);

        echo json_encode([
            'error' => 'No tienes permisos de administrador'
        ]);

        exit;
    }
}