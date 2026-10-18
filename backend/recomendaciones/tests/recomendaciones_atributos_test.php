<?php

/**
 * Tests de los atributos del perfil que usan los criterios: que el esquema y el saneador
 * los aceptan con sus límites y que cambian el resultado de la evaluación.
 * Uso: php backend/recomendaciones/tests/recomendaciones_atributos_test.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../recomendaciones_core.php';

$comprobaciones = 0;

function comprobar(bool $condicion, string $caso): void
{
    global $comprobaciones;
    $comprobaciones++;
    if (!$condicion) {
        throw new RuntimeException('Falló: ' . $caso);
    }
}

// --- Los 7 atributos nuevos en el esquema y en el saneador -----------------------

$nuevos = [
    'Portátiles' => ['almacenamiento_gb' => 1024],
    'Tarjetas gráficas' => ['fabricante' => 'nvidia'],
    'Auriculares' => ['cancelacion_ruido' => true],
    'Móviles' => ['camara_principal_mp' => 48, 'pantalla_hz' => 120],
    'Smartwatch' => ['sensores' => ['frecuencia_cardiaca', 'sueno', 'spo2']],
    'Televisores' => ['hdr' => ['HDR10', 'HDR10+', 'HLG']],
];
foreach ($nuevos as $categoria => $atributos) {
    comprobar(
        validarPerfilRecomendacion((object) ['atributos' => (object) $atributos], $categoria)['atributos'] === $atributos,
        "el panel acepta los atributos nuevos de $categoria"
    );
    comprobar(
        sanitizarPerfilCategoriaRecomendaciones($categoria, $atributos) === $atributos,
        "el asistente conserva los atributos nuevos de $categoria (antes los descartaba)"
    );
}

comprobar(validarPerfilRecomendacion((object) ['usos' => (object) ['movilidad' => 'adecuado']], 'Portátiles')['usos'] === ['movilidad' => 'adecuado'], 'el panel admite el uso movilidad');
comprobar(validarPerfilRecomendacion((object) ['usos' => (object) ['viajes' => 'adecuado']], 'Auriculares')['usos'] === ['viajes' => 'adecuado'], 'el panel admite el uso viajes en auriculares');

// --- El saneador descarta lo que el panel no aceptaría ---------------------------

$sucio = [
    'fabricante' => 'apple',          // fuera de la lista
    'vram_gb' => -4,                  // negativo
    'clave_inventada' => 1,           // desconocida para la categoría
    'rendimiento_gaming' => null,     // dato desconocido
];
comprobar(sanitizarPerfilCategoriaRecomendaciones('Tarjetas gráficas', $sucio) === [], 'descarta valores inválidos, claves desconocidas y nulos');
comprobar(sanitizarPerfilCategoriaRecomendaciones('Smartwatch', ['sensores' => ['frecuencia_cardiaca', 'rayos_x']]) === [], 'descarta una lista con un valor no permitido');
comprobar(sanitizarPerfilCategoriaRecomendaciones('Smartwatch', ['sensores' => []]) === [], 'una lista vacía es un dato desconocido');
comprobar(sanitizarPerfilCategoriaRecomendaciones('Smartwatch', ['sensores' => ['sueno', 'sueno']]) === ['sensores' => ['sueno']], 'quita duplicados de las listas');
comprobar(sanitizarPerfilCategoriaRecomendaciones('Auriculares', ['cancelacion_ruido' => 'sí']) === [], 'un booleano debe ser true o false');
comprobar(sanitizarPerfilCategoriaRecomendaciones('Móviles', ['camara_principal_mp' => 5000]) === [], 'respeta los máximos del esquema');
comprobar(sanitizarPerfilCategoriaRecomendaciones('Móviles', ['resistencia_ip' => ' ip68 ']) === ['resistencia_ip' => 'IP68'], 'normaliza el grado IP como el panel');
comprobar(sanitizarPerfilCategoriaRecomendaciones('Portátiles', ['cpu_modelo' => '  Ryzen 7  ']) === ['cpu_modelo' => 'Ryzen 7'], 'recorta los textos como el panel');
comprobar(sanitizarPerfilCategoriaRecomendaciones('Accesorios', ['ram_gb' => 16]) === [], 'categoría sin esquema: sin atributos');
comprobar(
    sanitizarPerfilCategoriaRecomendaciones('Portátiles', ['ram_gb' => 16, 'gpu_tipo' => 'dedicada', 'vram_gb' => 8]) === ['ram_gb' => 16, 'gpu_tipo' => 'dedicada'],
    'conserva los válidos y descarta los de otra categoría'
);

// --- Alineamiento: los atributos que usan los criterios existen en el esquema -------

$usadosPorCriterios = [
    'Portátiles' => ['gpu_tipo', 'gpu_modelo', 'ram_gb', 'pantalla_hz', 'almacenamiento_gb', 'peso_kg', 'autonomia_h', 'pantalla_pulgadas', 'cpu_modelo'],
    'Tarjetas gráficas' => ['vram_gb', 'fabricante'],
    'Procesadores' => ['nucleos', 'hilos'],
    'Auriculares' => ['conexion', 'microfono', 'autonomia_h', 'autonomia_estuche_h', 'resistencia_ip', 'formato', 'cancelacion_ruido', 'peso_g'],
    'Móviles' => ['ram_gb', 'almacenamiento_gb', 'autonomia_h', 'resistencia_ip', 'camara_principal_mp', 'pantalla_hz'],
    'Smartwatch' => ['gps', 'resistencia_agua_atm', 'sensores', 'compatibilidad', 'autonomia_dias'],
    'Televisores' => ['pantalla_hz', 'funciones_gaming', 'resolucion', 'hdr', 'pantalla_pulgadas'],
];
foreach ($usadosPorCriterios as $categoria => $claves) {
    $esquema = array_keys(esquemaPerfilPorCategoria($categoria)['atributos']);
    foreach ($claves as $clave) {
        comprobar(in_array($clave, $esquema, true), "el esquema de $categoria incluye $clave");
    }
}
foreach (catalogoUsosRecomendaciones() as $categoriaCatalogo => $usos) {
    $nombre = ['portatiles' => 'Portátiles', 'tarjetas graficas' => 'Tarjetas gráficas', 'procesadores' => 'Procesadores',
        'auriculares' => 'Auriculares', 'moviles' => 'Móviles', 'smartwatch' => 'Smartwatch', 'televisores' => 'Televisores'][$categoriaCatalogo];
    comprobar(
        array_diff(array_keys($usos), esquemaPerfilPorCategoria($nombre)['usos']) === [],
        "los usos del catálogo de $nombre se pueden valorar en el panel"
    );
}

// --- Con los atributos nuevos, los usos que antes daban «sin dato» ya se evalúan ----

$evaluar = static fn (string $categoria, array $atributos, string $consulta): string => evaluarProductoRecomendaciones(
    ['categoria' => $categoria, 'nombre' => 'X', 'especificaciones' => sanitizarPerfilCategoriaRecomendaciones($categoria, $atributos), 'usos' => []],
    $consulta,
    '',
    true
)['classification'];
comprobar($evaluar('Móviles', ['camara_principal_mp' => 48], 'móvil para hacer fotos') === 'confirmed', 'fotografía con cámara de 48 MP');
comprobar($evaluar('Televisores', ['resolucion' => '4K', 'hdr' => ['HDR10+']], 'tele para ver series') === 'confirmed', 'cine con 4K y HDR');
comprobar($evaluar('Smartwatch', ['sensores' => ['frecuencia_cardiaca', 'sueno']], 'reloj para controlar el sueño') === 'confirmed', 'salud con sensores');
comprobar($evaluar('Auriculares', ['cancelacion_ruido' => true, 'autonomia_h' => 8, 'autonomia_estuche_h' => 24], 'auriculares para el avión') === 'confirmed', 'viajes con ANC y 32 h');
comprobar($evaluar('Portátiles', ['ram_gb' => 16, 'almacenamiento_gb' => 512], 'portátil para editar vídeo') === 'confirmed', 'edición con 512 GB');

echo "OK: {$comprobaciones} comprobaciones\n";
