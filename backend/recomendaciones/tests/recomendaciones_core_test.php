<?php

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

function esperarError(callable $accion, string $codigo, string $caso): void
{
    try {
        $accion();
    } catch (ErrorRespuestaModeloRecomendaciones $error) {
        comprobar($error->codigo === $codigo, $caso . ' (código)');
        return;
    }

    throw new RuntimeException('Falló: ' . $caso . ' (no produjo error)');
}

function clasificacion(array $candidato, string $consulta, string $uso, bool $categoriaSolicitada = true): string
{
    return evaluarProductoRecomendaciones($candidato, $consulta, $uso, $categoriaSolicitada)['classification'];
}

// ---------------------------------------------------------------------------
// Filtros duros de presupuesto, stock y categoría (sin cambios de comportamiento)
// ---------------------------------------------------------------------------

$portatilAsus = [
    'id' => 1,
    'nombre' => 'ASUS TUF Gaming A15',
    'descripcion' => 'Portátil gaming con Ryzen 7 y pantalla de 15.6 pulgadas',
    'categoria' => 'Portátiles',
    'precio' => '899.99',
    'stock' => 2,
    'categoria_id' => 4,
    'especificaciones' => [
        'cpu_modelo' => 'Ryzen 7',
        'gpu_tipo' => 'dedicada',
        'gpu_modelo' => 'NVIDIA GeForce RTX 4050 Laptop GPU',
        'ram_gb' => 16,
        'pantalla_hz' => 144,
    ],
    'usos' => [],
];
$portatilMac = [
    'id' => 6,
    'nombre' => 'Apple MacBook Air 13" M5',
    'descripcion' => 'Herramienta para profesionales que buscan portabilidad',
    'categoria' => 'Portátiles',
    'precio' => '1449.00',
    'stock' => 1,
    'categoria_id' => 4,
    'especificaciones' => ['cpu_modelo' => 'Apple M5', 'ram_gb' => 16, 'gpu_tipo' => 'integrada', 'pantalla_hz' => 60],
    'usos' => [],
];
$auricularAirPods = [
    'id' => 7,
    'nombre' => 'Apple AirPods Pro 3',
    'descripcion' => 'Ideal para entornos exigentes como creación audiovisual, gaming competitivo o movilidad profesional.',
    'categoria' => 'Auriculares',
    'precio' => '229.00',
    'stock' => 3,
    'categoria_id' => 8,
    'especificaciones' => ['conexion' => ['bluetooth'], 'microfono' => true, 'resistencia_ip' => 'IP57'],
    'usos' => ['gimnasio' => 'adecuado'],
];
$auricularLogitech = [
    'id' => 8,
    'nombre' => 'Logitech G Pro X Auriculares Gaming Inalámbricos',
    'descripcion' => 'Audio envolvente y profesional.',
    'categoria' => 'Auriculares',
    'precio' => '129.00',
    'stock' => 4,
    'categoria_id' => 8,
    'especificaciones' => ['conexion' => ['usb_inalambrico'], 'microfono' => true],
    'usos' => [],
];

comprobar(candidatoCumpleFiltrosDurosRecomendaciones($portatilAsus, 100000, [4]), 'ASUS compite por debajo de 1000 €');
comprobar(candidatoCumpleFiltrosDurosRecomendaciones($portatilMac, 200000, [4]), 'MacBook compite con presupuesto suficiente');
comprobar(!candidatoCumpleFiltrosDurosRecomendaciones($portatilMac, 100000, [4]), 'MacBook excluido sobre presupuesto');
comprobar(candidatoCumpleFiltrosDurosRecomendaciones($auricularLogitech, 15000, [8]), 'Logitech dentro de 150 €');
comprobar(!candidatoCumpleFiltrosDurosRecomendaciones($auricularLogitech, 10000, [8]), 'Logitech fuera de 100 €');
comprobar(candidatoCumpleFiltrosDurosRecomendaciones($portatilAsus, 100000, []), 'sin categoría pedida no se filtra por categoría');
foreach (['stock' => 0, 'precio' => '1000.01', 'categoria_id' => 8] as $campo => $valor) {
    comprobar(
        !candidatoCumpleFiltrosDurosRecomendaciones(array_replace($portatilAsus, [$campo => $valor]), 100000, [4]),
        'filtro duro excluye por ' . $campo
    );
}
comprobar(!candidatoCumpleFiltrosDurosRecomendaciones(array_replace($portatilAsus, ['precio' => 899.99]), 100000, [4]), 'precio no textual se rechaza');

// ---------------------------------------------------------------------------
// Portátiles para gaming: GPU dedicada, RAM >= 16 GB, pantalla >= 120 Hz
// ---------------------------------------------------------------------------

$asusGaming = evaluarProductoRecomendaciones($portatilAsus, 'portátil gaming', 'jugar', true);
comprobar($asusGaming['classification'] === 'confirmed', 'portátil con los tres criterios es recomendado');
comprobar(str_contains($asusGaming['reason'], 'NVIDIA GeForce RTX 4050 Laptop GPU'), 'motivo cita la GPU real');
comprobar(str_contains($asusGaming['reason'], 'pantalla de 144 Hz (mínimo 120 Hz)'), 'texto numérico: primero el valor real y luego el mínimo');
comprobar(str_contains($asusGaming['reason'], 'RAM de 16 GB (mínimo 16 GB)'), 'texto de RAM con valor real y mínimo');

$macGaming = evaluarProductoRecomendaciones($portatilMac, 'portátil gaming', 'jugar', true);
comprobar($macGaming['classification'] === 'candidate', 'GPU integrada puntúa menos pero no descarta (antes: excluido)');
comprobar(
    str_contains($macGaming['reason'], 'No cumple: GPU integrada (se pide dedicada); pantalla de 60 Hz (mínimo 120 Hz).'),
    'motivo explica qué no cumple con valor real y mínimo'
);
comprobar($macGaming['puntuacion'] < $asusGaming['puntuacion'], 'GPU integrada puntúa por debajo');

$asusSinDatos = array_replace($portatilAsus, ['especificaciones' => ['cpu_modelo' => 'Ryzen 7']]);
$sinDatos = evaluarProductoRecomendaciones($asusSinDatos, 'portátil gaming', 'jugar', true);
comprobar($sinDatos['classification'] === 'candidate', 'datos ausentes llevan a «podría servirte», no a excluido');
comprobar(
    str_contains($sinDatos['reason'], 'Sin dato registrado: tipo de GPU (se pide dedicada); RAM (mínimo 16 GB); frecuencia de pantalla (mínimo 120 Hz).'),
    'motivo indica los datos que faltan y el mínimo exigido'
);

$asusParcial = array_replace($portatilAsus, ['especificaciones' => ['gpu_tipo' => 'dedicada', 'ram_gb' => 16]]);
comprobar(clasificacion($asusParcial, 'portátil gaming', 'jugar') === 'candidate', 'un criterio sin dato impide recomendar');

comprobar(
    clasificacion(array_replace($asusSinDatos, ['usos' => ['gaming' => 'adecuado']]), 'portátil gaming', 'jugar') === 'confirmed',
    'uso «adecuado» del administrador recomienda si ningún dato lo contradice'
);
comprobar(
    clasificacion(array_replace($portatilMac, ['usos' => ['gaming' => 'adecuado']]), 'portátil gaming', 'jugar') === 'candidate',
    'uso «adecuado» no recomienda si un dato lo contradice'
);
comprobar(
    clasificacion(array_replace($portatilAsus, ['usos' => ['gaming' => 'no_recomendado']]), 'portátil gaming', 'jugar') === 'excluded',
    'uso «no adecuado» del administrador excluye'
);
comprobar(
    clasificacion(array_replace($portatilAsus, ['usos' => ['programacion' => 'no_recomendado']]), 'portátil gaming', 'jugar') === 'confirmed',
    'la valoración de otro uso no afecta'
);

comprobar(clasificacion($portatilMac, 'portátil con GPU dedicada para jugar', 'jugar') === 'excluded', 'requisito explícito de GPU dedicada contradicho excluye');
comprobar(clasificacion($portatilMac, 'portátil para jugar sin GPU dedicada', 'jugar') === 'candidate', 'GPU dedicada negada no se exige');

// El texto «gaming» en portátiles solo ordena, nunca confirma.
$sinTexto = array_replace($asusSinDatos, ['nombre' => 'Portátil A15', 'descripcion' => 'Portátil con Ryzen 7']);
$conTexto = evaluarProductoRecomendaciones($asusSinDatos, 'portátil gaming', 'jugar', true);
$evaluacionSinTexto = evaluarProductoRecomendaciones($sinTexto, 'portátil gaming', 'jugar', true);
comprobar($conTexto['classification'] === 'candidate', 'texto «gaming» no confirma un portátil');
comprobar($conTexto['puntuacion'] > $evaluacionSinTexto['puntuacion'], 'texto «gaming» sube el portátil en el orden');
comprobar(
    evaluarProductoRecomendaciones($portatilAsus, 'portátil para programar', 'programar', true)['puntuacion'] ===
        evaluarProductoRecomendaciones(array_replace($portatilAsus, ['nombre' => 'Portátil A15', 'descripcion' => '']), 'portátil para programar', 'programar', true)['puntuacion'],
    'texto «gaming» no influye fuera del uso gaming'
);

// ---------------------------------------------------------------------------
// Auriculares para gaming: 2.4 GHz o cable, micrófono y texto gaming/7.1/envolvente
// ---------------------------------------------------------------------------

comprobar(clasificacion($auricularLogitech, 'auriculares para jugar', 'jugar') === 'confirmed', 'auricular con los tres criterios es recomendado');
$airPodsGaming = evaluarProductoRecomendaciones($auricularAirPods, 'auriculares para jugar', 'jugar', true);
comprobar($airPodsGaming['classification'] === 'candidate', 'solo Bluetooth puntúa menos pero no descarta');
comprobar(str_contains($airPodsGaming['reason'], 'conexión Bluetooth (se pide 2.4 GHz o cable)'), 'motivo cita la conexión real y lo que se pide');
comprobar(
    str_contains(evaluarProductoRecomendaciones($auricularLogitech, 'auriculares para jugar', 'jugar', true)['reason'], 'conexión inalámbrica 2.4 GHz (USB) (baja latencia)'),
    'motivo nombra la conexión de forma legible'
);

$sinMicrofonoDato = array_replace($auricularLogitech, ['especificaciones' => ['conexion' => ['jack']]]);
comprobar(clasificacion($sinMicrofonoDato, 'auriculares para jugar', 'jugar') === 'candidate', 'micrófono sin dato impide recomendar');
comprobar(clasificacion($sinMicrofonoDato, 'auriculares para jugar sin micrófono', 'jugar') === 'confirmed', 'micrófono negado deja de exigirse');
comprobar(
    clasificacion(array_replace($auricularLogitech, ['especificaciones' => ['conexion' => ['jack'], 'microfono' => false]]), 'auriculares para jugar', 'jugar') === 'candidate',
    'sin micrófono puntúa menos en gaming pero no descarta'
);
comprobar(
    clasificacion(array_replace($auricularLogitech, ['nombre' => 'Auriculares Pro', 'descripcion' => 'No apto para gaming.']), 'auriculares para jugar', 'jugar') === 'candidate',
    'texto gaming negado no cuenta'
);
comprobar(
    clasificacion(array_replace($auricularLogitech, ['nombre' => 'Auriculares Pro', 'descripcion' => 'Sonido 7.1 virtual']), 'auriculares para jugar', 'jugar') === 'confirmed',
    '«7.1» cuenta como señal de texto'
);
comprobar(
    !str_contains(evaluarProductoRecomendaciones($auricularLogitech, 'auriculares para jugar', 'jugar', true)['reason'], 'Latencia'),
    'la latencia desconocida no se menciona ni penaliza'
);

// Requisito explícito de micrófono fuera del uso gaming.
$conMicrofono = evaluarProductoRecomendaciones($auricularAirPods, 'auriculares con micrófono', 'llamadas', true);
comprobar($conMicrofono['classification'] === 'confirmed', 'sin uso concreto, la característica pedida y confirmada recomienda (antes: podría servir)');
comprobar($conMicrofono['reason'] === 'Cumple lo que pides: micrófono.', 'motivo confirma el micrófono pedido');
comprobar(
    clasificacion(array_replace($auricularAirPods, ['especificaciones' => ['conexion' => ['bluetooth']]]), 'auriculares con micrófono', 'llamadas') === 'candidate',
    'característica pedida sin dato no recomienda'
);
comprobar(
    clasificacion($auricularAirPods, 'auriculares para jugar con micrófono', 'jugar') === 'candidate',
    'con un uso concreto mandan sus criterios, no solo la característica pedida'
);
comprobar(clasificacion($portatilAsus, 'portátil con GPU dedicada', 'trabajo diario') === 'confirmed', 'GPU dedicada pedida y confirmada recomienda');
comprobar(clasificacion($portatilMac, 'portátil con GPU dedicada', 'trabajo diario') === 'excluded', 'GPU dedicada pedida y contradicha excluye');
comprobar(clasificacion($portatilAsus, 'portátil ligero', 'trabajo diario') === 'candidate', 'sin uso ni característica pedida no se recomienda');
comprobar(
    clasificacion(array_replace($auricularAirPods, ['especificaciones' => ['microfono' => false]]), 'auriculares con micrófono', 'llamadas') === 'excluded',
    'micrófono pedido y ausente excluye'
);

// ---------------------------------------------------------------------------
// Detección de voz (sin cambios de comportamiento)
// ---------------------------------------------------------------------------

$solicitudesVoz = [
    'auriculares para jugar con micrófono' => 'affirmative',
    'auriculares para jugar y hablar con mis amigos' => 'affirmative',
    'auriculares para jugar con chat de voz' => 'affirmative',
    'auriculares para jugar sin micrófono' => 'negated',
    'auriculares para jugar, no necesito voz' => 'negated',
    'auriculares gaming, no quiero usar el micrófono' => 'negated',
    'auriculares para jugar' => 'ambiguous',
    'auriculares gaming quizá necesite micrófono' => 'ambiguous',
    'auriculares para jugar con voz, pero no necesito voz' => 'ambiguous',
];
foreach ($solicitudesVoz as $consultaVoz => $resultadoEsperado) {
    comprobar(
        solicitudNecesitaComunicacionVozRecomendaciones($consultaVoz) === $resultadoEsperado,
        'intención de voz para consulta: ' . $consultaVoz
    );
}
comprobar(
    solicitudNecesitaComunicacionVozRecomendaciones('Auriculares para jugar sin micrófono') === 'negated',
    'normalización de acentos y mayúsculas conserva la negación'
);

// ---------------------------------------------------------------------------
// M1: los usos negados no cuentan como intención
// ---------------------------------------------------------------------------

$intenciones = [
    'portátil para programar, no para juegos' => 'programacion',
    'auriculares para el gimnasio, no para jugar' => 'gimnasio',
    'portátil sin jugar, solo para programar' => 'programacion',
    'no lo quiero para jugar' => null,
    'portátil para jugar' => 'gaming',
    'portátil para programar y jugar' => 'gaming',
    'tele para la consola' => 'gaming',
    'auriculares para la PS5' => 'gaming',
];
foreach ($intenciones as $texto => $esperada) {
    comprobar(
        detectarIntencionTecnicaRecomendaciones(normalizarTextoIdoneidadRecomendaciones($texto)) === $esperada,
        'intención de: ' . $texto
    );
}
comprobar(
    clasificacion($auricularAirPods, 'auriculares', 'para el gimnasio, no para jugar') === 'confirmed',
    'la negación del gaming no anula la valoración «adecuado» para gimnasio'
);

// ---------------------------------------------------------------------------
// M3: los televisores usan su clave real y tienen criterios para gaming
// ---------------------------------------------------------------------------

$tvSamsung = [
    'id' => 11,
    'nombre' => 'TV Samsung QLED 65"',
    'descripcion' => '4K UltraHD 50Hz',
    'categoria' => 'Televisores',
    'precio' => '509.00',
    'stock' => 5,
    'categoria_id' => 7,
    'especificaciones' => ['pantalla_hz' => 50, 'funciones_gaming' => ['ALLM']],
    'usos' => [],
];
$tvSamsungEvaluada = evaluarProductoRecomendaciones($tvSamsung, 'tele para la consola', 'jugar', true);
comprobar($tvSamsungEvaluada['classification'] === 'candidate', 'TV de 50 Hz con ALLM podría servir para gaming (antes: excluida)');
comprobar(str_contains($tvSamsungEvaluada['reason'], 'ALLM') && str_contains($tvSamsungEvaluada['reason'], '50 Hz'), 'motivo de la TV cita sus datos');
comprobar(
    clasificacion(array_replace($tvSamsung, ['especificaciones' => ['pantalla_hz' => 120, 'funciones_gaming' => ['VRR']]]), 'tele para jugar', 'jugar') === 'confirmed',
    'TV de 120 Hz con VRR es recomendada para gaming'
);

// Resto de categorías con criterios provisionales.
$grafica = ['id' => 2, 'nombre' => 'NVIDIA RTX 5070', 'descripcion' => '', 'categoria' => 'Tarjetas gráficas', 'precio' => '649.99', 'stock' => 5, 'categoria_id' => 2, 'especificaciones' => ['vram_gb' => 12], 'usos' => []];
comprobar(clasificacion($grafica, 'gráfica para jugar', 'jugar') === 'confirmed', 'gráfica con 12 GB de VRAM es recomendada');
comprobar(clasificacion(array_replace($grafica, ['especificaciones' => ['vram_gb' => 6]]), 'gráfica para jugar', 'jugar') === 'candidate', 'gráfica con 6 GB podría servir');
$procesador = evaluarProductoRecomendaciones(['categoria' => 'Procesadores', 'nombre' => 'Ryzen', 'especificaciones' => ['nucleos' => 8]], 'procesador para jugar', 'jugar', true);
comprobar($procesador['classification'] === 'confirmed', 'procesador de 8 núcleos es recomendado');
comprobar(str_contains($procesador['reason'], '8 núcleos (mínimo 6)'), 'texto de núcleos con valor real y mínimo');
comprobar(
    clasificacion(['categoria' => 'Móviles', 'nombre' => 'iPhone', 'especificaciones' => ['ram_gb' => 8]], 'móvil para jugar', 'jugar') === 'confirmed',
    'móvil con 8 GB de RAM es recomendado'
);

// Sin categoría pedida solo se evalúan categorías con criterios para el uso.
$reloj = ['categoria' => 'Smartwatch', 'nombre' => 'Watch', 'especificaciones' => ['gps' => true]];
comprobar(clasificacion($reloj, 'algo para jugar', 'jugar', false) === 'excluded', 'smartwatch no entra en una búsqueda gaming sin categoría');
comprobar(clasificacion($grafica, 'algo para jugar', 'jugar', false) === 'confirmed', 'gráfica sí entra en una búsqueda gaming sin categoría');
comprobar(clasificacion($reloj, 'smartwatch', 'diario', true) === 'candidate', 'con categoría pedida y sin uso reconocido, el producto puede servir');

// Programación: sin criterios aprobados, solo datos informativos y valoración del administrador.
$programar = evaluarProductoRecomendaciones($portatilMac, 'portátil para programar, no para juegos', 'programar', true);
comprobar($programar['classification'] === 'candidate', 'programación sin criterios aprobados no confirma por datos');
comprobar(str_contains($programar['reason'], 'CPU: Apple M5') && !str_contains($programar['reason'], 'GPU'), 'programación muestra CPU y RAM, no criterios gaming');
comprobar(
    clasificacion(array_replace($portatilMac, ['usos' => ['programacion' => 'adecuado']]), 'portátil para programar', 'programar') === 'confirmed',
    'valoración «adecuado» para programar confirma'
);

// ---------------------------------------------------------------------------
// Señal de texto
// ---------------------------------------------------------------------------

comprobar(senalTextoGamingRecomendaciones('Auriculares Gaming Inalámbricos') === 'gaming', 'detecta «gaming»');
comprobar(senalTextoGamingRecomendaciones('Sonido envolvente DTS') === 'envolvente', 'detecta «envolvente»');
comprobar(senalTextoGamingRecomendaciones('Sonido 7.1.') === '7.1', 'detecta «7.1» al final de frase');
comprobar(senalTextoGamingRecomendaciones('Versión 17.1 del firmware') === null, '«17.1» no es «7.1»');
comprobar(senalTextoGamingRecomendaciones('No apto para gaming') === null, 'ignora «no apto para gaming»');
comprobar(senalTextoGamingRecomendaciones('Sin sonido envolvente') === null, 'ignora «sin sonido envolvente»');

// ---------------------------------------------------------------------------
// A1: micrófono, consola o cámara no anulan la búsqueda si hay categoría
// ---------------------------------------------------------------------------

$categorias = [];
foreach (['Portátiles', 'Tarjetas gráficas', 'Procesadores', 'Móviles', 'Auriculares', 'Smartwatch', 'Televisores'] as $indice => $nombre) {
    $categorias[] = ['id' => $indice + 1, 'nombre' => $nombre];
}
$tipo = static fn (string $consulta): array =>
    resolverTipoProductoRecomendaciones(normalizarSinonimosRecomendaciones($consulta), $categorias);
foreach ([
    'auriculares con micrófono' => [5],
    'auriculares para la consola' => [5],
    'móvil con buena cámara' => [4],
    'tele para la consola' => [7],
    'portátil con teclado retroiluminado' => [1],
] as $consulta => $esperadas) {
    $resultado = $tipo($consulta);
    comprobar(
        !$resultado['no_disponible'] && $resultado['categoria_ids'] === $esperadas,
        'A1: «' . $consulta . '» busca en su categoría'
    );
}
comprobar($tipo('micrófono para streaming')['no_disponible'], 'tipo no vendido sin categoría sigue sin resultados');
comprobar($tipo('teclado gaming')['no_disponible'], 'teclado sin categoría sigue sin resultados');
comprobar($tipo('un pc para jugar')['ambiguo_sin_categoria'], '«pc» sin categoría sigue siendo ambiguo');

// ---------------------------------------------------------------------------
// Orden y niveles
// ---------------------------------------------------------------------------

$evaluados = [
    ['id' => 1, 'precio' => '100.00', 'classification' => 'candidate', 'puntuacion' => 1.0, 'reason' => 'a', 'datos' => []],
    ['id' => 2, 'precio' => '50.00', 'classification' => 'candidate', 'puntuacion' => 1.0, 'reason' => 'b', 'datos' => []],
    ['id' => 3, 'precio' => '10.00', 'classification' => 'candidate', 'puntuacion' => 2.0, 'reason' => 'c', 'datos' => []],
    ['id' => 4, 'precio' => '10.00', 'classification' => 'candidate', 'puntuacion' => -1.0, 'reason' => 'd', 'datos' => []],
    ['id' => 5, 'precio' => '900.00', 'classification' => 'confirmed', 'puntuacion' => 3.0, 'reason' => 'e', 'datos' => []],
];
$niveles = agruparPorNivelRecomendaciones($evaluados);
comprobar(array_column($niveles['candidate'], 'id') === [3, 2, 1], 'ordena por puntuación, luego precio, y limita a 3 por nivel');
comprobar(array_column($niveles['confirmed'], 'id') === [5], 'los recomendados van en su propio nivel');

// ---------------------------------------------------------------------------
// Validación de la respuesta de Ollama: solo ordena y redacta
// ---------------------------------------------------------------------------

$productosModelo = [
    '1' => ['nombre' => 'ASUS TUF Gaming A15', 'categoria' => 'Portátiles', 'reason' => $asusGaming['reason'], 'datos' => $asusGaming['datos']],
    '6' => ['nombre' => 'Apple MacBook Air 13" M5', 'categoria' => 'Portátiles', 'reason' => $macGaming['reason'], 'datos' => $macGaming['datos']],
];
$valida = validarRespuestaModeloRecomendaciones(['orden' => [
    ['id' => 6, 'explicacion' => 'Tiene 16 GB de RAM, pero su GPU es integrada y la pantalla es de 60 Hz.'],
    ['id' => 1, 'explicacion' => 'Cumple todo: GPU dedicada NVIDIA GeForce RTX 4050, 16 GB de RAM y pantalla de 144 Hz.'],
]], $productosModelo);
comprobar(array_keys($valida) === [6, 1], 'conserva el orden propuesto por el modelo');
comprobar($valida[1] !== null && $valida[6] !== null, 'acepta explicaciones con datos verificados');

$inventada = validarRespuestaModeloRecomendaciones(['orden' => [
    ['id' => 1, 'explicacion' => 'Tiene 32 GB de RAM y una pantalla de 144 Hz, perfecta para jugar.'],
    ['id' => 6, 'explicacion' => 'Ofrece una latencia muy baja y buena GPU integrada para juegos ligeros.'],
]], $productosModelo);
comprobar($inventada[1] === null, 'descarta una explicación con una cifra inventada');
comprobar($inventada[6] === null, 'descarta una explicación con un término técnico no verificado');
comprobar(
    validarRespuestaModeloRecomendaciones(['orden' => [['id' => 1, 'explicacion' => 'Bien.']]], $productosModelo)[1] === null,
    'descarta explicaciones demasiado cortas'
);
comprobar(
    validarRespuestaModeloRecomendaciones(['orden' => [['id' => 1, 'explicacion' => 'Más información en https://ejemplo.com sobre este portátil.']]], $productosModelo)[1] === null,
    'descarta explicaciones con enlaces'
);
// Regresiones observadas con qwen3:4b en la prueba real del endpoint.
$tvModelo = ['11' => ['nombre' => 'TV Samsung', 'categoria' => 'Televisores', 'reason' => $tvSamsungEvaluada['reason'], 'datos' => $tvSamsungEvaluada['datos']]];
comprobar(
    validarRespuestaModeloRecomendaciones(['orden' => [['id' => 11, 'explicacion' => 'Cumple ALLM. No cumple: pantalla de 120 Hz o más (tiene .50 Hz).']]], $tvModelo)[11] === null,
    'descarta una cifra deformada («.50 Hz» no es «50 Hz»)'
);
comprobar(
    validarRespuestaModeloRecomendaciones(['orden' => [['id' => 11, 'explicacion' => 'Cumple ALLM, pero su pantalla es de 50 Hz y no llega a 120 Hz.']]], $tvModelo)[11] !== null,
    'acepta las cifras exactas de los datos'
);
$airPodsMicrofono = ['nombre' => 'Apple AirPods Pro 3', 'categoria' => 'Auriculares', 'reason' => $conMicrofono['reason'], 'datos' => $conMicrofono['datos']];
$genericas = validarRespuestaModeloRecomendaciones(['orden' => [
    ['id' => 7, 'explicacion' => 'Cumple con tener micrófono, pero no es ideal para uso diario por su diseño y precio.'],
]], ['7' => $airPodsMicrofono]);
comprobar($genericas[7] === null, 'descarta valoraciones no respaldadas por los datos (diseño, precio, ideal)');
$repetidas = validarRespuestaModeloRecomendaciones(['orden' => [
    ['id' => 7, 'explicacion' => 'Tiene micrófono, como pides para tu búsqueda.'],
    ['id' => 8, 'explicacion' => 'Tiene micrófono, como pides para tu búsqueda.'],
]], ['7' => $airPodsMicrofono, '8' => $airPodsMicrofono]);
comprobar($repetidas[7] === null && $repetidas[8] === null, 'descarta el mismo texto repetido para productos distintos');
comprobar(array_keys($repetidas) === [7, 8], 'aunque descarte los textos, conserva el orden propuesto');
comprobar(
    validarRespuestaModeloRecomendaciones(['orden' => [
        ['id' => 7, 'explicacion' => 'Los auric: tiene micrófono, como pide el cliente. Cumple lo que pides: micrófono.'],
    ]], ['7' => $airPodsMicrofono], 'auriculares con micrófono uso diario')[7] === null,
    'descarta una palabra cortada («auric»)'
);
comprobar(
    validarRespuestaModeloRecomendaciones(['orden' => [
        ['id' => 7, 'explicacion' => 'Tiene micrófono, así que cumple lo que pides para el uso diario.'],
    ]], ['7' => $airPodsMicrofono], 'auriculares con micrófono uso diario')[7] !== null,
    'acepta palabras que vienen de la consulta'
);
comprobar(
    validarRespuestaModeloRecomendaciones(['orden' => [
        ['id' => 7, 'explicacion' => 'Tiene micrófono y además resulta elegante, ligero, resistente y versátil en cualquier situación.'],
    ]], ['7' => $airPodsMicrofono], 'auriculares con micrófono')[7] === null,
    'descarta explicaciones con demasiadas palabras ajenas a los datos'
);

esperarError(fn () => validarRespuestaModeloRecomendaciones(['orden' => [['id' => 999, 'explicacion' => 'x']]], $productosModelo), 'invalid_product_id', 'ID que no se pasó al modelo');
esperarError(fn () => validarRespuestaModeloRecomendaciones(['orden' => [['id' => 1, 'explicacion' => 'x'], ['id' => 1, 'explicacion' => 'x']]], $productosModelo), 'invalid_model_response', 'ID repetido');
esperarError(fn () => validarRespuestaModeloRecomendaciones(['recommendations' => []], $productosModelo), 'invalid_model_response', 'estructura antigua o desconocida');
esperarError(fn () => validarRespuestaModeloRecomendaciones(null, $productosModelo), 'invalid_model_response', 'contenido vacío');

// ---------------------------------------------------------------------------
// Respuesta pública: solo los recomendados; el modelo solo los reordena
// ---------------------------------------------------------------------------

$publicos = ['1' => ['id' => 1, 'nombre' => 'A'], '2' => ['id' => 2, 'nombre' => 'B'], '3' => ['id' => 3, 'nombre' => 'C']];
$nivelesRespuesta = [
    'confirmed' => [['id' => 1, 'reason' => 'Texto PHP 1'], ['id' => 2, 'reason' => 'Texto PHP 2']],
    'candidate' => [['id' => 3, 'reason' => 'Texto PHP 3']],
];
$sinModelo = construirRespuestaRecomendaciones($nivelesRespuesta, $publicos);
comprobar(array_keys($sinModelo) === ['recommendations'], 'la respuesta no incluye «podrían servirte» ni mensaje cuando hay recomendados');
comprobar(array_column(array_column($sinModelo['recommendations'], 'producto'), 'id') === [1, 2], 'sin modelo se usa el orden de PHP');
comprobar($sinModelo['recommendations'][0]['reason'] === 'Texto PHP 1' && $sinModelo['recommendations'][0]['source'] === 'php', 'sin modelo se usa el texto de PHP');

$conModelo = construirRespuestaRecomendaciones($nivelesRespuesta, $publicos, [2 => 'Explicación del modelo para B', 1 => null, 3 => 'No debe aparecer']);
comprobar(array_column(array_column($conModelo['recommendations'], 'producto'), 'id') === [2, 1], 'el modelo reordena los recomendados');
comprobar($conModelo['recommendations'][0]['source'] === 'ollama', 'explicación verificada del modelo se marca como tal');
comprobar($conModelo['recommendations'][1]['reason'] === 'Texto PHP 1' && $conModelo['recommendations'][1]['source'] === 'php', 'explicación descartada usa el texto de PHP');
comprobar(count($conModelo['recommendations']) === 2, 'un producto que no es recomendado nunca se muestra, aunque el modelo lo mencione');

$soloCandidatos = construirRespuestaRecomendaciones(['confirmed' => [], 'candidate' => [['id' => 3, 'reason' => 'x']]], $publicos);
comprobar($soloCandidatos['recommendations'] === [], 'sin recomendados no se muestra ningún producto');
comprobar(
    $soloCandidatos['message'] === 'No hay productos que cumplan todo lo que pides. Prueba a ampliar el presupuesto o cambiar la búsqueda.',
    'sin recomendados se muestra el mensaje claro'
);

// Mensaje sin productos dentro del presupuesto.
comprobar(
    mensajeSinProductosEnPresupuestoRecomendaciones(['Auriculares'], '100.00', ['nombre' => 'Logitech G Pro X', 'precio' => '129.00']) ===
        'No hay productos de Auriculares dentro de tu presupuesto (100,00 €). El más barato disponible es «Logitech G Pro X», por 129,00 €.',
    'indica el más barato de la categoría y su precio'
);
comprobar(
    mensajeSinProductosEnPresupuestoRecomendaciones(['Portátiles'], '500.00', ['nombre' => 'X', 'precio' => '1449.00']) ===
        'No hay productos de Portátiles dentro de tu presupuesto (500,00 €). El más barato disponible es «X», por 1.449,00 €.',
    'formatea los miles al estilo español'
);
comprobar(
    mensajeSinProductosEnPresupuestoRecomendaciones(['Procesadores'], '100.00', null) === 'No hay productos de Procesadores disponibles en este momento.',
    'sin stock en la categoría no inventa un producto'
);
comprobar(
    mensajeSinProductosEnPresupuestoRecomendaciones([], '50.00', null) === 'No hay productos disponibles dentro de tu presupuesto (50,00 €).',
    'sin categoría pedida el mensaje es genérico'
);

echo "OK: {$comprobaciones} comprobaciones\n";
