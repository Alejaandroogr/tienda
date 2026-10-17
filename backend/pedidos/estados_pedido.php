<?php

declare(strict_types=1);

/**
 * Transiciones permitidas entre estados de pedido. «entregado» y «cancelado» son
 * finales. No se vuelve atrás, no se saltan pasos y un pedido enviado no se puede
 * cancelar (sería una devolución, que no está modelada).
 *
 * Debe coincidir con TRANSICIONES_PEDIDO de src/pages/admin/AdminPedidos.tsx.
 */
const TRANSICIONES_PEDIDO = [
    'pendiente' => ['procesando', 'cancelado'],
    'procesando' => ['enviado', 'cancelado'],
    'enviado' => ['entregado'],
    'entregado' => [],
    'cancelado' => [],
];

function estadoPedidoValido(string $estado): bool
{
    return array_key_exists($estado, TRANSICIONES_PEDIDO);
}

/**
 * Motivo por el que no se permite pasar de un estado a otro, o null si se permite.
 */
function motivoTransicionPedidoNoPermitida(string $desde, string $hasta): ?string
{
    if (!estadoPedidoValido($desde) || !estadoPedidoValido($hasta)) {
        return 'Estado no válido';
    }

    if ($desde === $hasta) {
        return 'El pedido ya está en ese estado';
    }

    if (TRANSICIONES_PEDIDO[$desde] === []) {
        return 'Un pedido ' . $desde . ' no puede cambiar de estado';
    }

    if (!in_array($hasta, TRANSICIONES_PEDIDO[$desde], true)) {
        return 'Un pedido ' . $desde . ' solo puede pasar a ' . implode(' o ', TRANSICIONES_PEDIDO[$desde]);
    }

    return null;
}
