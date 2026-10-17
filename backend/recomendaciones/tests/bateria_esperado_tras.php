<?php
// Expectativas de la batería tras rellenar los atributos nuevos (fase 2). Solo se
// listan las consultas cuyo resultado cambia respecto a «hoy». Se carga desde
// bateria_endpoint.php, que define NEUTRO y $SIN.
return [
    5 => ['portátil para editar vídeo', NEUTRO, 2000, ['rec' => [1, 6]]],
    25 => ['auriculares con cancelación de ruido para el avión', NEUTRO, 2000, ['rec' => [7]]],
    31 => ['móvil para hacer fotos', NEUTRO, 2000, ['rec' => [4, 5]]],
    34 => ['teléfono con mucha batería para viajar', NEUTRO, 2000, ['rec' => [4, 5]]],
    35 => ['móvil para trabajar', NEUTRO, 2000, ['rec' => [4, 5]]],
    36 => ['reloj para correr', NEUTRO, 2000, ['rec' => [9, 10]]],
    37 => ['smartwatch para controlar el sueño', NEUTRO, 2000, ['rec' => [9, 10]]],
    38 => ['smartwatch para nadar', NEUTRO, 2000, ['rec' => [9, 10]]],
    39 => ['smartwatch compatible con Android', NEUTRO, 2000, ['rec' => [10]]],
    42 => ['televisor para ver Netflix', NEUTRO, 2000, ['rec' => [11]]],
    44 => ['tv 4K de 65 pulgadas', NEUTRO, 2000, ['rec' => [11]]],
    // Con los 120 Hz de los iPhone (solo ordena en móviles gaming), el iPhone 17
    // (1,4 puntos) supera a la RTX 5070 (1,0) en el tercer puesto.
    45 => ['algo para jugar', NEUTRO, 2000, ['rec' => [1, 8, 5]]],
    // Sin cambio de resultado, pero ahora por un dato en contra en lugar de por falta de datos:
    4 => ['portátil ligero para viajar', NEUTRO, 2000, ['rec' => [6]]],          // ASUS: 2,2 kg
    43 => ['tele para ver el fútbol', NEUTRO, 2000, ['msg' => $SIN]],            // 50 Hz
];
