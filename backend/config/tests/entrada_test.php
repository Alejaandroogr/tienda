<?php

declare(strict_types=1);

require_once __DIR__ . '/../errores.php';

$comprobaciones = 0;

function comprobar(bool $condicion, string $caso): void
{
    global $comprobaciones;
    $comprobaciones++;
    if (!$condicion) {
        throw new RuntimeException('Falló: ' . $caso);
    }
}

// El manejo común desactiva la salida de errores al cliente.
comprobar(ini_get('display_errors') === '0', 'display_errors desactivado');
comprobar(ini_get('log_errors') === '1', 'log_errors activado');

// Campos de texto: antes, trim() sobre un array lanzaba un error fatal con traza.
$datos = ['email' => ' a@b.c ', 'lista' => ['x'], 'objeto' => ['a' => 1], 'numero' => 5, 'nulo' => null, 'vacio' => ''];
comprobar(campoTextoSolicitud($datos, 'email') === ' a@b.c ', 'devuelve el texto sin modificarlo');
comprobar(campoTextoSolicitud($datos, 'vacio') === '', 'un texto vacío sigue siendo texto (cada endpoint decide si lo acepta)');
foreach (['lista', 'objeto', 'numero', 'nulo', 'falta'] as $campo) {
    comprobar(campoTextoSolicitud($datos, $campo) === null, 'campo de texto inválido o ausente: ' . $campo);
}
comprobar(campoTextoSolicitud(null, 'email') === null, 'cuerpo JSON vacío o inválido');
comprobar(campoTextoSolicitud('texto', 'email') === null, 'cuerpo JSON que no es un objeto');

// Campos enteros: antes, (int) convertía un array en 1 y cambiar-rol actuaba sobre el usuario 1.
$ids = ['entero' => 5, 'texto' => '12', 'lista' => [999], 'cero' => 0, 'negativo' => -3, 'decimal' => 1.5,
    'texto_decimal' => '1.5', 'texto_mixto' => '7abc', 'cero_inicial' => '007', 'booleano' => true];
comprobar(campoEnteroSolicitud($ids, 'entero') === 5, 'acepta un entero JSON');
comprobar(campoEnteroSolicitud($ids, 'texto') === 12, 'acepta un entero en texto');
foreach (['lista', 'cero', 'negativo', 'decimal', 'texto_decimal', 'texto_mixto', 'cero_inicial', 'booleano', 'falta'] as $campo) {
    comprobar(campoEnteroSolicitud($ids, $campo) === null, 'entero inválido o ausente: ' . $campo);
}

echo "OK: {$comprobaciones} comprobaciones\n";
