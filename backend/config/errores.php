<?php

/**
 * Manejo de errores común del backend: nunca muestra rutas, SQL, credenciales ni
 * trazas al cliente. Los detalles solo van al log del servidor.
 */

ini_set('display_errors', '0');
ini_set('log_errors', '1');

function responderErrorInternoBackend(): void
{
    if (headers_sent()) {
        return;
    }

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Error interno del servidor'], JSON_UNESCAPED_UNICODE);
}

// Se respeta un manejador propio ya registrado (por ejemplo, el de recomendaciones).
$manejadorExcepcionesAnterior = set_exception_handler(static function (Throwable $error): void {
    error_log('Excepción no controlada: ' . get_class($error) . ': ' . $error->getMessage() .
        ' en ' . $error->getFile() . ':' . $error->getLine());
    responderErrorInternoBackend();
});
if ($manejadorExcepcionesAnterior !== null) {
    set_exception_handler($manejadorExcepcionesAnterior);
}
unset($manejadorExcepcionesAnterior);

if (!defined('MANEJO_ERRORES_FATALES_REGISTRADO')) {
    define('MANEJO_ERRORES_FATALES_REGISTRADO', true);

    register_shutdown_function(static function (): void {
        $error = error_get_last();

        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
            responderErrorInternoBackend();
        }
    });
}

/**
 * Devuelve el campo como texto, o null si falta o no es una cadena (por ejemplo,
 * un array o un número enviado en el JSON).
 */
function campoTextoSolicitud(mixed $datos, string $campo): ?string
{
    if (!is_array($datos) || !array_key_exists($campo, $datos) || !is_string($datos[$campo])) {
        return null;
    }

    return $datos[$campo];
}

/**
 * Devuelve el campo como entero positivo (número entero JSON o texto de dígitos),
 * o null si falta o tiene otro tipo. Evita que (int) convierta un array en 1.
 */
function campoEnteroSolicitud(mixed $datos, string $campo): ?int
{
    if (!is_array($datos) || !array_key_exists($campo, $datos)) {
        return null;
    }

    $valor = $datos[$campo];

    if (is_int($valor)) {
        return $valor > 0 ? $valor : null;
    }

    if (is_string($valor) && preg_match('/\A[1-9]\d{0,9}\z/', $valor) === 1) {
        return (int) $valor;
    }

    return null;
}
