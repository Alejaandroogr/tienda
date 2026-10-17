<?php

declare(strict_types=1);

require_once __DIR__ . '/../estados_pedido.php';

$comprobaciones = 0;

function comprobar(bool $condicion, string $caso): void
{
    global $comprobaciones;
    $comprobaciones++;
    if (!$condicion) {
        throw new RuntimeException('Falló: ' . $caso);
    }
}

// Matriz completa: solo estas 5 transiciones están permitidas.
$permitidas = [
    'pendiente>procesando', 'pendiente>cancelado',
    'procesando>enviado', 'procesando>cancelado',
    'enviado>entregado',
];
$estados = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
foreach ($estados as $desde) {
    foreach ($estados as $hasta) {
        $esperada = in_array("$desde>$hasta", $permitidas, true);
        comprobar(
            (motivoTransicionPedidoNoPermitida($desde, $hasta) === null) === $esperada,
            "$desde → $hasta " . ($esperada ? 'permitida' : 'prohibida')
        );
    }
}

// Mensajes de las decisiones aprobadas.
comprobar(motivoTransicionPedidoNoPermitida('enviado', 'cancelado') === 'Un pedido enviado solo puede pasar a entregado', 'un pedido enviado no se cancela');
comprobar(motivoTransicionPedidoNoPermitida('procesando', 'pendiente') === 'Un pedido procesando solo puede pasar a enviado o cancelado', 'no se vuelve de procesando a pendiente');
comprobar(motivoTransicionPedidoNoPermitida('pendiente', 'pendiente') === 'El pedido ya está en ese estado', 'el mismo estado da 409');
comprobar(motivoTransicionPedidoNoPermitida('cancelado', 'cancelado') === 'El pedido ya está en ese estado', 'cancelar dos veces no se permite (no hay doble reposición)');
comprobar(motivoTransicionPedidoNoPermitida('entregado', 'pendiente') === 'Un pedido entregado no puede cambiar de estado', 'entregado es final');
comprobar(motivoTransicionPedidoNoPermitida('cancelado', 'procesando') === 'Un pedido cancelado no puede cambiar de estado', 'cancelado es final');
comprobar(motivoTransicionPedidoNoPermitida('pendiente', 'perdido') === 'Estado no válido', 'estado desconocido');
comprobar(!estadoPedidoValido('Pendiente'), 'los estados distinguen mayúsculas');

// El panel de administración ofrece exactamente las mismas transiciones.
$tsx = file_get_contents(__DIR__ . '/../../../src/pages/admin/AdminPedidos.tsx');
preg_match('/const TRANSICIONES_PEDIDO[^{]*\{(.*?)\};/s', $tsx, $bloque);
preg_match_all("/(\w+): \[([^\]]*)\]/", $bloque[1] ?? '', $filas, PREG_SET_ORDER);
$frontend = [];
foreach ($filas as [, $estado, $lista]) {
    preg_match_all("/'(\w+)'/", $lista, $destinos);
    $frontend[$estado] = $destinos[1];
}
comprobar($frontend === TRANSICIONES_PEDIDO, 'las transiciones del panel coinciden con las del backend');

echo "OK: {$comprobaciones} comprobaciones\n";
