<?php

declare(strict_types=1);

require_once __DIR__ . '/../pedido_lineas.php';

$comprobaciones = 0;

function comprobar(bool $condicion, string $caso): void
{
    global $comprobaciones;
    $comprobaciones++;
    if (!$condicion) {
        throw new RuntimeException('Falló: ' . $caso);
    }
}

function esperarRechazo(mixed $productos, string $caso): void
{
    try {
        normalizarLineasPedido($productos);
    } catch (ErrorLineasPedido) {
        comprobar(true, $caso);
        return;
    }

    throw new RuntimeException('Falló: ' . $caso . ' (no se rechazó)');
}

// A2: líneas repetidas del mismo producto se agrupan antes de comprobar el stock.
comprobar(
    normalizarLineasPedido([
        ['producto_id' => 5, 'cantidad' => 2],
        ['producto_id' => 5, 'cantidad' => 2],
    ]) === [5 => 4],
    'dos líneas de 2 unidades del mismo producto suman 4 (antes se validaban por separado)'
);
comprobar(
    normalizarLineasPedido([
        ['producto_id' => 9, 'cantidad' => 1],
        ['producto_id' => 3, 'cantidad' => 2],
        ['producto_id' => 9, 'cantidad' => 3],
    ]) === [3 => 2, 9 => 4],
    'agrupa por producto y ordena por ID para bloquear siempre en el mismo orden'
);
comprobar(normalizarLineasPedido([['producto_id' => '7', 'cantidad' => '2']]) === [7 => 2], 'acepta enteros enviados como texto de dígitos');

// Simulación de la comprobación de stock que hace crear.php sobre el total agrupado.
$stockDisponible = [5 => 2];
$cantidades = normalizarLineasPedido([
    ['producto_id' => 5, 'cantidad' => 2],
    ['producto_id' => 5, 'cantidad' => 2],
]);
comprobar($cantidades[5] > $stockDisponible[5], 'el total agrupado (4) supera el stock (2): el pedido se rechaza');

// Entradas inválidas.
esperarRechazo(null, 'productos ausente');
esperarRechazo([], 'pedido vacío');
esperarRechazo('5', 'productos no es una lista');
esperarRechazo(['a' => ['producto_id' => 1, 'cantidad' => 1]], 'productos es un objeto, no una lista');
esperarRechazo([['producto_id' => 1]], 'línea sin cantidad');
esperarRechazo([['cantidad' => 1]], 'línea sin producto');
esperarRechazo(['texto'], 'línea que no es un objeto');
esperarRechazo([['producto_id' => 1, 'cantidad' => 0]], 'cantidad cero');
esperarRechazo([['producto_id' => 1, 'cantidad' => -3]], 'cantidad negativa');
esperarRechazo([['producto_id' => 1, 'cantidad' => 1.5]], 'cantidad decimal (antes se truncaba a 1)');
esperarRechazo([['producto_id' => 1, 'cantidad' => '2abc']], 'cantidad con texto (antes se convertía en 2)');
esperarRechazo([['producto_id' => 'abc', 'cantidad' => 1]], 'producto no numérico');
esperarRechazo([['producto_id' => 0, 'cantidad' => 1]], 'producto cero');
esperarRechazo([['producto_id' => 1, 'cantidad' => true]], 'cantidad booleana');
esperarRechazo([['producto_id' => 1, 'cantidad' => [2]]], 'cantidad como lista');
esperarRechazo([['producto_id' => 1, 'cantidad' => 1001]], 'cantidad por encima del máximo');
esperarRechazo(
    [['producto_id' => 1, 'cantidad' => 600], ['producto_id' => 1, 'cantidad' => 600]],
    'el máximo se aplica al total agrupado, no a cada línea'
);
esperarRechazo(array_fill(0, 101, ['producto_id' => 1, 'cantidad' => 1]), 'demasiadas líneas');

echo "OK: {$comprobaciones} comprobaciones\n";
