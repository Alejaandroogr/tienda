<?php

declare(strict_types=1);

require_once __DIR__ . '/../validacion_producto.php';

$comprobaciones = 0;

function comprobar(bool $condicion, string $caso): void
{
    global $comprobaciones;
    $comprobaciones++;
    if (!$condicion) {
        throw new RuntimeException('Falló: ' . $caso);
    }
}

// Precio: antes, (float) convertía «abc» en 0 y se guardaba gratis.
foreach ([
    [1299.9, '1299.90'], [899.99, '899.99'], [0, '0.00'], [15, '15.00'],
    ['1299.90', '1299.90'], ['1299,90', '1299.90'], [' 25 ', '25.00'], ['99999999.99', '99999999.99'],
] as [$valor, $esperado]) {
    comprobar(precioProductoValido($valor) === $esperado, 'precio válido: ' . var_export($valor, true));
}
foreach (['abc', '', '12abc', '-5', -1, '1.999', 10.555, '1e3', '100000000', 100000000.0, true, null, [10], NAN, INF] as $valor) {
    comprobar(precioProductoValido($valor) === null, 'precio inválido: ' . json_encode($valor));
}

// Stock: antes, (int) convertía «abc» en 0 y «3.7» en 3.
foreach ([[0, 0], [5, 5], ['12', 12], [' 7 ', 7], [2147483647, 2147483647]] as [$valor, $esperado]) {
    comprobar(stockProductoValido($valor) === $esperado, 'stock válido: ' . var_export($valor, true));
}
foreach (['abc', '', '-1', -1, '3.7', 3.7, 3.0, '2147483648', true, null, [1]] as $valor) {
    comprobar(stockProductoValido($valor) === null, 'stock inválido: ' . json_encode($valor));
}

echo "OK: {$comprobaciones} comprobaciones\n";
