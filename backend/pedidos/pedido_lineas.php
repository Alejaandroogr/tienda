<?php

declare(strict_types=1);

const PEDIDO_MAX_LINEAS = 100;
const PEDIDO_MAX_CANTIDAD_LINEA = 1000;

final class ErrorLineasPedido extends InvalidArgumentException
{
}

/** Entero positivo enviado como número entero JSON o como texto de dígitos. */
function enteroPositivoPedido(mixed $valor): ?int
{
    if (is_int($valor)) {
        return $valor > 0 ? $valor : null;
    }

    if (is_string($valor) && preg_match('/\A[1-9]\d{0,9}\z/', $valor) === 1) {
        return (int) $valor;
    }

    return null;
}

/**
 * Valida las líneas de un pedido y agrupa las cantidades por producto, para que
 * el stock se compruebe sobre el total pedido de cada producto y no línea a línea.
 *
 * @return array<int, int> [producto_id => cantidad total], ordenado por producto_id
 */
function normalizarLineasPedido(mixed $productos): array
{
    if (!is_array($productos) || !array_is_list($productos) || $productos === []) {
        throw new ErrorLineasPedido('El pedido no contiene productos');
    }

    if (count($productos) > PEDIDO_MAX_LINEAS) {
        throw new ErrorLineasPedido('El pedido contiene demasiadas líneas');
    }

    $cantidades = [];

    foreach ($productos as $linea) {
        if (!is_array($linea) || !array_key_exists('producto_id', $linea) || !array_key_exists('cantidad', $linea)) {
            throw new ErrorLineasPedido('Producto del pedido no válido');
        }

        $productoId = enteroPositivoPedido($linea['producto_id']);
        $cantidad = enteroPositivoPedido($linea['cantidad']);

        if ($productoId === null || $cantidad === null) {
            throw new ErrorLineasPedido('Cantidad o producto no válido');
        }

        $cantidades[$productoId] = ($cantidades[$productoId] ?? 0) + $cantidad;

        if ($cantidades[$productoId] > PEDIDO_MAX_CANTIDAD_LINEA) {
            throw new ErrorLineasPedido('La cantidad pedida de un producto supera el máximo permitido');
        }
    }

    // Bloquear siempre en el mismo orden evita interbloqueos entre pedidos simultáneos.
    ksort($cantidades);

    return $cantidades;
}
