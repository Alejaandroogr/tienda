<?php

require_once __DIR__ . '/errores.php';

function iniciarSesion(): void
{
    if (session_status() !== PHP_SESSION_NONE) {
        return;
    }

    // Rechaza identificadores de sesión que no haya creado el servidor (fijación de sesión).
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');

    $https = !empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off';

    // HttpOnly: JavaScript no puede leer la cookie. SameSite=Lax: no se envía en
    // peticiones originadas en otros sitios. El frontend (localhost:5173) y la API
    // (localhost) son el mismo sitio, así que la sesión sigue funcionando.
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

function cerrarSesionActual(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $parametros = session_get_cookie_params();

        // Mismos atributos que la cookie de sesión, para que el navegador la sustituya.
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $parametros['path'],
            'domain' => $parametros['domain'],
            'secure' => $parametros['secure'],
            'httponly' => $parametros['httponly'],
            'samesite' => $parametros['samesite'],
        ]);
    }

    session_destroy();
}

/**
 * Relee de la BD el usuario de la sesión y actualiza sus datos en ella, para que
 * un cambio de rol o un borrado tenga efecto sin esperar a un nuevo login.
 * Devuelve null (y cierra la sesión) si no hay sesión o el usuario ya no existe.
 *
 * @return array{id:int, nombre:string, email:string, rol:string}|null
 */
function refrescarUsuarioSesion(PDO $pdo): ?array
{
    iniciarSesion();

    if (!isset($_SESSION['usuario_id'])) {
        return null;
    }

    $consulta = $pdo->prepare('SELECT id, nombre, email, rol FROM usuarios WHERE id = :id LIMIT 1');
    $consulta->execute([':id' => (int) $_SESSION['usuario_id']]);
    $usuario = $consulta->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        cerrarSesionActual();
        return null;
    }

    $_SESSION['usuario_nombre'] = $usuario['nombre'];
    $_SESSION['usuario_email'] = $usuario['email'];
    $_SESSION['usuario_rol'] = $usuario['rol'];

    return [
        'id' => (int) $usuario['id'],
        'nombre' => (string) $usuario['nombre'],
        'email' => (string) $usuario['email'],
        'rol' => (string) $usuario['rol'],
    ];
}

function exigirAdministrador(?PDO $pdo = null): void
{
    // Los endpoints de administración cargan la conexión antes de llamar aquí.
    $pdo ??= $GLOBALS['pdo'] ?? null;

    if (!$pdo instanceof PDO) {
        throw new LogicException('exigirAdministrador() necesita la conexión a la base de datos');
    }

    $usuario = refrescarUsuarioSesion($pdo);

    if ($usuario === null) {
        http_response_code(401);

        echo json_encode([
            'error' => 'No has iniciado sesión'
        ]);

        exit;
    }

    if ($usuario['rol'] !== 'admin') {
        http_response_code(403);

        echo json_encode([
            'error' => 'No tienes permisos de administrador'
        ]);

        exit;
    }
}