<?php

/**
 * Tests del catálogo de usos (recomendaciones_usos.php): detección de usos y de
 * características pedidas, negaciones y criterios de cada uso por categoría.
 * Uso: php backend/recomendaciones/tests/recomendaciones_usos_test.php
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

function usos(string $texto, string $categoria): array
{
    return detectarUsosCategoriaRecomendaciones(normalizarTextoIdoneidadRecomendaciones($texto), $categoria);
}

function evaluar(array $producto, string $consulta, string $uso = '', bool $categoria = true, ?array $forzados = null): array
{
    return evaluarProductoRecomendaciones($producto, $consulta, $uso, $categoria, $forzados);
}

function caracteristicas(string $consulta, string $categoria): array
{
    return array_column(detectarCaracteristicasRecomendaciones($consulta, '', $categoria), 'texto');
}

// --- Catálogo -----------------------------------------------------------------

$catalogo = catalogoUsosRecomendaciones();
comprobar(
    array_keys($catalogo) === ['portatiles', 'tarjetas graficas', 'procesadores', 'auriculares', 'moviles', 'smartwatch', 'televisores'],
    'el catálogo cubre las 7 categorías'
);
comprobar(array_keys($catalogo['portatiles']) === ['gaming', 'programacion', 'trabajo', 'edicion', 'movilidad'], 'usos de portátiles');
comprobar(array_keys($catalogo['auriculares']) === ['gaming', 'musica', 'trabajo', 'gimnasio', 'viajes'], 'usos de auriculares');
comprobar(array_keys($catalogo['smartwatch']) === ['gimnasio', 'deporte', 'salud', 'trabajo'], 'usos de smartwatch');
foreach ($catalogo as $categoria => $usosCategoria) {
    foreach ($usosCategoria as $id => $uso) {
        comprobar(criteriosUsoRecomendaciones($categoria, $id, [], '', 'ambiguous') !== null, "el uso $categoria/$id tiene criterios definidos");
        foreach ($uso['sinonimos'] as $sinonimo) {
            comprobar($sinonimo === normalizarTextoIdoneidadRecomendaciones($sinonimo), "sinónimo normalizado: $sinonimo");
        }
    }
}
comprobar(!in_array('nadar', array_merge(...array_column($catalogo['smartwatch'], 'sinonimos')), true), 'nadar no es un uso de smartwatch: es una característica');

// --- Detección por palabras clave --------------------------------------------

comprobar(usos('auriculares para correr', 'auriculares') === ['gimnasio'], '«correr» es gimnasio en auriculares');
comprobar(usos('reloj para correr', 'smartwatch') === ['deporte'], '«correr» es deporte en smartwatch');
comprobar(usos('portátil para viajar', 'portatiles') === ['movilidad'], '«viajar» es movilidad en portátiles');
comprobar(usos('auriculares para viajar', 'auriculares') === ['viajes'], '«viajar» es viajes en auriculares');
comprobar(usos('móvil para hacer fotos', 'moviles') === ['fotografia'], 'fotografía en móviles');
comprobar(usos('gpu para entrenar modelos de IA', 'tarjetas graficas') === ['ia'], 'IA en gráficas (frase de varias palabras)');
comprobar(usos('tarjeta gráfica para Blender', 'tarjetas graficas') === ['creacion_3d'], 'Blender es creación 3D');
comprobar(usos('televisor para ver Netflix', 'televisores') === ['cine_streaming'], 'Netflix es cine y series');
comprobar(usos('tele para ver el fútbol', 'televisores') === ['deportes'], 'fútbol es deportes');
comprobar(usos('portátil para la universidad', 'portatiles') === ['trabajo'], 'universidad es trabajo o estudios');
comprobar(usos('portátil para jugar, programar y editar vídeo', 'portatiles') === ['gaming', 'programacion'], 'como máximo 2 usos, en el orden en que aparecen');
comprobar(usos('portátil para programar, no para juegos', 'portatiles') === ['programacion'], 'los usos negados no cuentan');
comprobar(usos('smartwatch para programar', 'smartwatch') === [], 'un uso que no existe en la categoría no se detecta');
comprobar(array_keys(detectarUsosGlobalesRecomendaciones(normalizarTextoIdoneidadRecomendaciones('para programar'))) === ['programacion'], 'detección global para avisar de usos no aplicables');
comprobar(usos('hola', 'portatiles') === [], 'sin palabras clave no hay uso');
comprobar(usos('auriculares para escuchar podcasts en el bus', 'auriculares') === ['musica'], 'podcasts es música (Ollama lo clasificaba como gaming)');
comprobar(usos('algo para ver pelis en el salón', 'televisores') === ['cine_streaming'], '«pelis» es cine y series');

// --- Características explícitas ------------------------------------------------

comprobar(caracteristicas('portátil con 32 GB de RAM', 'portatiles') === ['RAM de 32 GB o más'], 'RAM pedida');
comprobar(caracteristicas('portátil con 16GB RAM y 144hz', 'portatiles') === ['RAM de 16 GB o más', 'pantalla de 144 Hz o más'], 'RAM y Hz sin espacios');
comprobar(caracteristicas('portátil con GPU dedicada', 'portatiles') === ['GPU dedicada'], 'GPU dedicada pedida');
comprobar(caracteristicas('procesador con 16 núcleos', 'procesadores') === ['16 núcleos o más'], 'núcleos pedidos');
comprobar(caracteristicas('gráfica de 16 GB', 'tarjetas graficas') === ['VRAM de 16 GB o más'], 'VRAM pedida');
comprobar(caracteristicas('auriculares con micrófono', 'auriculares') === ['micrófono'], 'micrófono pedido');
comprobar(caracteristicas('auriculares sin micrófono', 'auriculares') === [], 'micrófono negado no se pide');
comprobar(caracteristicas('auriculares con cancelación de ruido', 'auriculares') === ['cancelación de ruido'], 'cancelación de ruido pedida');
comprobar(caracteristicas('auriculares sin cancelación de ruido', 'auriculares') === [], 'cancelación de ruido negada no se pide');
comprobar(caracteristicas('auriculares sin cables', 'auriculares') === ['inalámbricos'], '«sin cables» pide inalámbricos');
comprobar(caracteristicas('auriculares resistentes al agua', 'auriculares') === ['resistencia al agua (IPX4 o más)'], 'resistencia al agua en auriculares');
comprobar(caracteristicas('smartwatch para nadar', 'smartwatch') === ['resistencia al agua de 5 ATM o más'], 'nadar exige 5 ATM');
comprobar(caracteristicas('reloj sumergible con GPS', 'smartwatch') === ['GPS', 'resistencia al agua de 5 ATM o más'], 'GPS y sumergible');
comprobar(caracteristicas('smartwatch compatible con Android', 'smartwatch') === ['compatible con Android'], 'compatibilidad con Android');
comprobar(caracteristicas('smartwatch para mi iPhone', 'smartwatch') === ['compatible con iPhone'], 'compatibilidad con iPhone');
comprobar(caracteristicas('tv 4K de 65 pulgadas', 'televisores') === ['resolución 4K o superior', 'pantalla de unas 65 pulgadas'], '4K y pulgadas');
comprobar(caracteristicas('tele de más de 55"', 'televisores') === ['pantalla de 55 pulgadas o más'], '«más de» pulgadas es un mínimo');
comprobar(caracteristicas('tele con HDR', 'televisores') === ['HDR'], 'HDR pedido');
comprobar(caracteristicas('portátil con micrófono', 'portatiles') === [], 'una característica de otra categoría no se aplica');

$minimo = ['tipo' => 'minimo', 'clave' => 'ram_gb', 'valor' => 16.0, 'texto' => ''];
comprobar(evaluarCaracteristicaRecomendaciones($minimo, ['ram_gb' => 32]) === true, 'mínimo cumplido');
comprobar(evaluarCaracteristicaRecomendaciones($minimo, ['ram_gb' => 8]) === false, 'mínimo incumplido');
comprobar(evaluarCaracteristicaRecomendaciones($minimo, []) === null, 'mínimo sin dato');
$aproximado = ['tipo' => 'aproximado', 'clave' => 'pantalla_pulgadas', 'valor' => 65.0, 'texto' => ''];
comprobar(evaluarCaracteristicaRecomendaciones($aproximado, ['pantalla_pulgadas' => 65]) === true, 'pulgadas aproximadas');
comprobar(evaluarCaracteristicaRecomendaciones($aproximado, ['pantalla_pulgadas' => 55]) === false, 'pulgadas lejanas');
$agua = ['tipo' => 'ip_agua', 'clave' => 'resistencia_ip', 'valor' => 4, 'texto' => ''];
comprobar(evaluarCaracteristicaRecomendaciones($agua, ['resistencia_ip' => 'IP57']) === true, 'IP57 protege del agua');
comprobar(evaluarCaracteristicaRecomendaciones($agua, ['resistencia_ip' => 'IPX4']) === true, 'IPX4 protege del agua');
comprobar(evaluarCaracteristicaRecomendaciones($agua, ['resistencia_ip' => 'IP6X']) === false, 'IP6X no protege del agua');

// --- Criterios de los usos nuevos (con datos de ejemplo) -------------------------

$portatilLigero = ['categoria' => 'Portátiles', 'nombre' => 'Ultra', 'especificaciones' => ['peso_kg' => 1.2, 'autonomia_h' => 15, 'ram_gb' => 16, 'almacenamiento_gb' => 1024], 'usos' => []];
comprobar(evaluar($portatilLigero, 'portátil ligero para viajar')['classification'] === 'confirmed', 'movilidad: 1,2 kg y 15 h');
comprobar(evaluar(array_replace($portatilLigero, ['especificaciones' => ['peso_kg' => 2.2, 'autonomia_h' => 15]]), 'portátil para viajar')['classification'] === 'candidate', 'movilidad: 2,2 kg no cumple');
comprobar(str_contains(evaluar($portatilLigero, 'portátil para viajar')['reason'], 'peso de 1.2 kg (máximo 1.6 kg)'), 'texto de máximo con valor real');
comprobar(evaluar($portatilLigero, 'portátil para editar vídeo')['classification'] === 'confirmed', 'edición: 16 GB y 1 TB');
comprobar(evaluar(array_replace($portatilLigero, ['especificaciones' => ['ram_gb' => 16]]), 'portátil para editar vídeo')['classification'] === 'candidate', 'edición sin almacenamiento no se recomienda');
comprobar(evaluar(array_replace($portatilLigero, ['especificaciones' => ['ram_gb' => 8]]), 'portátil para la universidad')['classification'] === 'confirmed', 'estudios: 8 GB bastan');

$auricular = ['categoria' => 'Auriculares', 'nombre' => 'X', 'especificaciones' => ['conexion' => ['bluetooth'], 'microfono' => true, 'autonomia_h' => 8, 'autonomia_estuche_h' => 24, 'resistencia_ip' => 'IP57', 'formato' => 'in_ear', 'cancelacion_ruido' => true], 'usos' => []];
comprobar(evaluar($auricular, 'auriculares para teletrabajo')['classification'] === 'confirmed', 'trabajo: micrófono y 8 h');
comprobar(evaluar($auricular, 'auriculares para el gimnasio')['classification'] === 'confirmed', 'gimnasio: IP57 e in-ear');
comprobar(evaluar($auricular, 'auriculares para el avión')['classification'] === 'confirmed', 'viajes: ANC y 32 h en total');
comprobar(evaluar(array_replace($auricular, ['especificaciones' => ['autonomia_h' => 8]]), 'auriculares para viajar')['classification'] === 'candidate', 'viajes sin ANC ni estuche no se recomienda');
comprobar(evaluar($auricular, 'auriculares para escuchar música')['classification'] === 'candidate', 'música: los datos no bastan');
comprobar(evaluar(array_replace($auricular, ['usos' => ['musica' => 'adecuado']]), 'auriculares para escuchar música')['classification'] === 'confirmed', 'música: solo si lo marca el administrador');
comprobar(
    evaluar(array_replace($auricular, ['especificaciones' => ['formato' => 'over_ear'], 'usos' => ['musica' => 'adecuado']]), 'auriculares para música')['puntuacion'] >
        evaluar(array_replace($auricular, ['especificaciones' => ['formato' => 'in_ear'], 'usos' => ['musica' => 'adecuado']]), 'auriculares para música')['puntuacion'],
    'música: over-ear sube en el orden'
);

$reloj = ['categoria' => 'Smartwatch', 'nombre' => 'W', 'especificaciones' => ['gps' => true, 'resistencia_agua_atm' => 5, 'sensores' => ['frecuencia_cardiaca', 'sueno'], 'compatibilidad' => ['android'], 'autonomia_dias' => 7], 'usos' => []];
comprobar(evaluar($reloj, 'reloj para correr')['classification'] === 'confirmed', 'deporte: GPS');
comprobar(evaluar(array_replace($reloj, ['especificaciones' => ['gps' => false]]), 'reloj para correr')['classification'] === 'candidate', 'deporte sin GPS no');
comprobar(evaluar($reloj, 'smartwatch para el gimnasio')['classification'] === 'confirmed', 'gimnasio: sensor de frecuencia cardíaca');
comprobar(evaluar($reloj, 'smartwatch para controlar el sueño')['classification'] === 'confirmed', 'salud: frecuencia cardíaca y sueño');
comprobar(evaluar($reloj, 'smartwatch para nadar')['classification'] === 'confirmed', 'nadar sin uso: 5 ATM confirmado');
comprobar(evaluar(array_replace($reloj, ['especificaciones' => ['resistencia_agua_atm' => 3]]), 'smartwatch para nadar')['classification'] === 'excluded', 'nadar con 3 ATM: dato en contra');
comprobar(evaluar($reloj, 'smartwatch compatible con iPhone')['classification'] === 'excluded', 'pide iPhone y solo es compatible con Android');

$tele = ['categoria' => 'Televisores', 'nombre' => 'T', 'especificaciones' => ['resolucion' => '4K', 'hdr' => ['HDR10+'], 'pantalla_hz' => 50, 'pantalla_pulgadas' => 65], 'usos' => []];
comprobar(evaluar($tele, 'tele para ver series')['classification'] === 'confirmed', 'cine: 4K y HDR');
comprobar(evaluar($tele, 'tele para ver el fútbol')['classification'] === 'candidate', 'deportes: 50 Hz no llega a 100');
comprobar(evaluar($tele, 'tv 4K de 65 pulgadas')['classification'] === 'confirmed', 'características 4K y 65"');

// Atributos aún no admitidos por el saneador: «hoy» dan «sin dato».
comprobar(evaluar(['categoria' => 'Móviles', 'nombre' => 'M', 'especificaciones' => ['ram_gb' => 8]], 'móvil para hacer fotos')['classification'] === 'candidate', 'fotografía sin dato de cámara no se recomienda');

// --- Varios usos, negaciones y uso desconocido -----------------------------------

$asus = ['categoria' => 'Portátiles', 'nombre' => 'ASUS TUF Gaming A15', 'descripcion' => '', 'especificaciones' => ['gpu_tipo' => 'dedicada', 'ram_gb' => 16, 'pantalla_hz' => 144], 'usos' => []];
$mac = ['categoria' => 'Portátiles', 'nombre' => 'MacBook', 'descripcion' => '', 'especificaciones' => ['gpu_tipo' => 'integrada', 'ram_gb' => 16, 'pantalla_hz' => 60, 'peso_kg' => 1.23, 'autonomia_h' => 18], 'usos' => []];
$ambos = evaluar($asus, 'portátil para programar y jugar');
comprobar($ambos['classification'] === 'confirmed' && $ambos['usos'] === ['programacion', 'gaming'], 'varios usos: el ASUS cumple los dos');
comprobar(str_contains($ambos['reason'], 'para programar') && str_contains($ambos['reason'], 'para jugar'), 'varios usos: el motivo explica cada uno');
comprobar(evaluar($mac, 'portátil para programar y jugar')['classification'] === 'candidate', 'varios usos: el MacBook solo cumple uno');
comprobar(evaluar($mac, 'portátil para programar, no para juegos')['classification'] === 'confirmed', 'negación: solo cuenta programar');
comprobar(evaluar($mac, 'portátil')['classification'] === 'unknown', 'sin uso ni característica con categoría: lista «Disponibles»');
comprobar(evaluar($mac, 'algo bonito', '', false)['classification'] === 'excluded', 'sin uso ni categoría: no se evalúa');
comprobar(evaluar($mac, 'portátil para casa', '', true, ['trabajo'])['classification'] === 'confirmed', 'uso clasificado por Ollama: se aplican sus criterios');
comprobar(evaluar($mac, 'portátil', '', true, ['salud'])['classification'] === 'unknown', 'uso forzado que no existe en la categoría se ignora');
comprobar(evaluar(array_replace($mac, ['usos' => ['programacion' => 'no_recomendado']]), 'portátil para programar y jugar')['classification'] === 'excluded', 'valoración «no adecuado» de uno de los usos excluye');

// --- Uso opcional: con el campo vacío, todo sale de la consulta ------------------

comprobar(evaluar($asus, 'portátil gaming', '')['classification'] === 'confirmed', 'uso vacío: «portátil gaming» recomienda el ASUS');
comprobar(evaluar($asus, 'portátil gaming', '')['usos'] === ['gaming'], 'uso vacío: el uso se detecta en la consulta');
comprobar(evaluar($mac, 'portátil', '')['classification'] === 'unknown', 'uso vacío y consulta sin uso: lista «Disponibles»');
comprobar(evaluar($mac, 'portátil', 'para programar')['classification'] === 'confirmed', 'el uso escrito aparte se sigue teniendo en cuenta');

// Solo se pregunta a Ollama si queda algo más que el nombre del producto.
foreach (['smartwatch', 'un smartwatch', 'reloj inteligente', 'tele', 'quiero un portátil'] as $soloProducto) {
    comprobar(textoInterpretableRecomendaciones($soloProducto) === '', "solo el producto, nada que interpretar: «{$soloProducto}»");
}
comprobar(textoInterpretableRecomendaciones('portátil para casa') === 'casa', 'queda texto que interpretar: «casa»');
comprobar(textoInterpretableRecomendaciones('smartwatch es un regalo') === 'regalo', 'queda texto que interpretar: «regalo»');

// --- Validación de la clasificación de Ollama ------------------------------------

comprobar(validarClasificacionUsoModeloRecomendaciones(['uso' => 'trabajo'], ['gaming', 'trabajo']) === 'trabajo', 'acepta un uso de la lista');
comprobar(validarClasificacionUsoModeloRecomendaciones(['uso' => 'ninguno'], ['gaming']) === null, '«ninguno» no fuerza uso');
foreach ([['uso' => 'hackear'], ['uso' => 5], ['uso' => 'gaming', 'extra' => 1], 'gaming', null] as $invalida) {
    try {
        validarClasificacionUsoModeloRecomendaciones($invalida, ['gaming']);
        comprobar(false, 'clasificación inválida rechazada: ' . json_encode($invalida));
    } catch (ErrorRespuestaModeloRecomendaciones) {
        comprobar(true, 'clasificación inválida rechazada: ' . json_encode($invalida));
    }
}

// --- Mensajes ----------------------------------------------------------------------

comprobar(str_contains(mensajeConsultaIrreconocibleRecomendaciones(), '«portátil para programar»'), 'irreconocible: incluye ejemplos');
comprobar(mensajeSinStockRecomendaciones(['Procesadores'], 'AMD Ryzen 7 9700X') === 'No hay procesadores disponibles ahora mismo. El «AMD Ryzen 7 9700X» cumpliría lo que pides, pero está agotado.', 'sin stock con agotado que cumple');
comprobar(mensajeSinStockRecomendaciones(['Procesadores'], null) === 'No hay procesadores disponibles ahora mismo.', 'sin stock');
comprobar(
    mensajeMasBaratoQueCumpleRecomendaciones('500.00', 'jugar', ['nombre' => 'ASUS TUF Gaming A15', 'precio' => '899.99']) ===
        "Ninguno de los productos que cumplen entra en tu presupuesto (500,00\u{00A0}€). El más barato que cumple para jugar es «ASUS TUF Gaming A15», por 899,99\u{00A0}€.",
    'presupuesto insuficiente: el más barato que cumple el uso'
);
comprobar(str_contains(mensajeMasBaratoQueCumpleRecomendaciones('10.00', null, ['nombre' => 'X', 'precio' => '20.00']), 'que cumple lo que pides'), 'presupuesto insuficiente sin uso');
comprobar(mensajeVariosUsosSinResultadoRecomendaciones(['programar', 'jugar']) === 'Ninguno cumple a la vez para programar y para jugar. Prueba a buscarlos por separado.', 'varios usos sin resultado');
comprobar(str_contains(avisoUsoNoAplicableRecomendaciones(['programar'], ['Smartwatch']), 'No valoramos Smartwatch para programar'), 'aviso de uso no aplicable');
comprobar(str_contains(avisoUsoDesconocidoRecomendaciones(['Smartwatch']), 'productos de Smartwatch disponibles'), 'aviso de uso desconocido');

echo "OK: {$comprobaciones} comprobaciones\n";
