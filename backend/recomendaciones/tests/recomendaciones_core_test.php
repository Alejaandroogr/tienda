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

$portatilAsus = [
    'id' => 1,
    'precio' => '999.00',
    'stock' => 2,
    'categoria_id' => 4,
    'especificaciones' => ['cpu_modelo' => 'Ryzen 7', 'pantalla_pulgadas' => 15.6],
];
$portatilMac = [
    'id' => 6,
    'precio' => '1499.00',
    'stock' => 1,
    'categoria_id' => 4,
    'especificaciones' => ['cpu_modelo' => 'Apple M', 'ram_gb' => 16],
];
$auricularAirPods = [
    'id' => 7,
    'precio' => '199.00',
    'stock' => 3,
    'categoria_id' => 8,
    'especificaciones' => ['conexion' => 'bluetooth', 'formato' => 'in_ear', 'resistencia_ip' => 'IPX4'],
];
$auricularLogitech = [
    'id' => 8,
    'precio' => '89.00',
    'stock' => 4,
    'categoria_id' => 8,
    'especificaciones' => ['conexion' => 'usb_inalambrico', 'formato' => 'over_ear', 'microfono' => true],
];

comprobar(candidatoCumpleFiltrosDurosRecomendaciones($portatilAsus, 100000, [4]), 'ASUS compite para portátil gaming');
comprobar(candidatoCumpleFiltrosDurosRecomendaciones($portatilMac, 200000, [4]), 'MacBook compite para programación');
comprobar(!candidatoCumpleFiltrosDurosRecomendaciones($portatilMac, 100000, [4]), 'MacBook excluido sobre presupuesto');
comprobar(candidatoCumpleFiltrosDurosRecomendaciones($portatilAsus, 100000, [4]), 'ASUS elegible debajo de 1000 €');
comprobar(candidatoCumpleFiltrosDurosRecomendaciones($auricularAirPods, 25000, [8]), 'AirPods evaluable para gimnasio');
comprobar(candidatoCumpleFiltrosDurosRecomendaciones($auricularLogitech, 15000, [8]), 'Logitech evaluable para gaming');

$orden = validarRespuestaModeloRecomendaciones([
    'recommendations' => [
        ['id' => 7, 'assessment' => 'supported', 'evidence' => ['formato', 'resistencia_ip']],
    ],
], ['7' => $auricularAirPods]);
comprobar(str_contains($orden[0]['reason'], 'Resistencia IP: IPX4'), 'motivo basado en dato real');

$desconocido = validarRespuestaModeloRecomendaciones([
    'recommendations' => [
        ['id' => 1, 'assessment' => 'uncertain', 'evidence' => ['cpu_modelo']],
    ],
], ['1' => $portatilAsus]);
comprobar(str_contains($desconocido[0]['reason'], 'no basta'), 'atributos ausentes permanecen desconocidos');

esperarError(
    fn () => validarRespuestaModeloRecomendaciones(['recommendations' => [['id' => 999, 'assessment' => 'supported', 'evidence' => ['cpu_modelo']]]], ['1' => $portatilAsus]),
    'invalid_product_id',
    'ID externo al conjunto permitido'
);
esperarError(
    fn () => validarRespuestaModeloRecomendaciones(['recommendations' => [['id' => 1, 'assessment' => 'supported', 'evidence' => ['gpu_modelo_inventada']]]], ['1' => $portatilAsus]),
    'invalid_model_evidence',
    'clave de evidencia inventada'
);
esperarError(
    fn () => validarRespuestaModeloRecomendaciones(['recommendations' => [['id' => 1, 'assessment' => 'uncertain', 'evidence' => ['cpu_modelo: Ryzen 7']]]], ['1' => $portatilAsus]),
    'invalid_model_evidence',
    'par clave-valor no aceptado como evidencia'
);
esperarError(
    fn () => validarRespuestaModeloRecomendaciones(['recommendations' => [['id' => 1, 'assessment' => 'uncertain', 'evidence' => [7]]]], ['1' => $portatilAsus]),
    'invalid_model_evidence',
    'evidencia de tipo incorrecto'
);
esperarError(
    fn () => validarRespuestaModeloRecomendaciones(['recommendations' => [['id' => 1, 'assessment' => 'supported', 'evidence' => []]]], ['1' => $portatilAsus]),
    'invalid_model_evidence',
    'supported sin evidencia'
);
comprobar(!candidatoCumpleFiltrosDurosRecomendaciones(array_replace($portatilAsus, ['stock' => 0]), 100000, [4]), 'stock cero excluido');
comprobar(!candidatoCumpleFiltrosDurosRecomendaciones($portatilAsus, 100000, [8]), 'categoría incorrecta excluida');
comprobar(!candidatoCumpleFiltrosDurosRecomendaciones(array_replace($portatilAsus, ['precio' => '1000.01']), 100000, [4]), 'exceso de presupuesto excluido');

$portatilSemantico = array_replace($portatilAsus, [
    'categoria' => 'Portátiles',
    'especificaciones' => [
        'cpu_modelo' => 'Ryzen 7',
        'pantalla_pulgadas' => 15.6,
        'gpu_tipo' => 'integrada',
        'gpu_modelo' => 'Modelo de perfil',
    ],
]);
$clasificacionIrrelevante = clasificarIdoneidadFinalRecomendaciones(
    $portatilSemantico,
    'portátil para jugar',
    'jugar'
);
comprobar($clasificacionIrrelevante['classification'] === 'excluded', 'portátil gaming sin criterio de rendimiento no entra en listas');
$propuestaConEvidenciaIrrelevante = validarRespuestaModeloRecomendaciones([
    'recommendations' => [['id' => 1, 'assessment' => 'supported', 'evidence' => ['cpu_modelo']]],
], ['1' => $portatilSemantico]);
comprobar($propuestaConEvidenciaIrrelevante[0]['assessment'] === 'supported', 'el parser valida la clave real sin decidir idoneidad');
comprobar(
    clasificarIdoneidadFinalRecomendaciones($portatilSemantico, 'portátil para jugar', 'jugar')['classification'] === 'excluded',
    'assessment supported no admite portátil gaming sin criterio aprobado'
);

$portatilGpuDesconocida = array_replace($portatilSemantico, [
    'especificaciones' => ['cpu_modelo' => 'Ryzen 7', 'pantalla_pulgadas' => 15.6],
]);
$clasificacionGpuDesconocida = clasificarIdoneidadFinalRecomendaciones(
    $portatilGpuDesconocida,
    'portátil para jugar',
    'jugar'
);
comprobar($clasificacionGpuDesconocida['classification'] === 'excluded', 'sin especificaciones relevantes conocidas no se admite candidato');

$sinDatosRelevantes = array_replace($portatilSemantico, [
    'especificaciones' => ['cpu_modelo' => 'Ryzen 7', 'pantalla_pulgadas' => 15.6],
]);
comprobar(
    clasificarIdoneidadFinalRecomendaciones($sinDatosRelevantes, 'portátil para jugar', 'jugar')['classification'] === 'excluded',
    'evidencias conocidas pero irrelevantes no justifican candidato'
);

$rechazoExplicito = clasificarIdoneidadFinalRecomendaciones(
    $portatilSemantico,
    'portátil para jugar con GPU dedicada',
    'jugar'
);
comprobar($rechazoExplicito['classification'] === 'excluded', 'requisito explícito contradicho se excluye');
$sinRequisitoGpuDedicada = clasificarIdoneidadFinalRecomendaciones(
    $portatilSemantico,
    'portátil para jugar sin GPU dedicada',
    'jugar'
);
comprobar($sinRequisitoGpuDedicada['classification'] === 'excluded', 'GPU integrada no se interpreta como negativa, pero falta evidencia de rendimiento');
comprobar(!cumpleCriterioAfirmativoAprobadoRecomendaciones('gaming', $portatilSemantico, []), 'sin criterio aprobado no se confirma producto');

$auricularConexion = [
    'categoria' => 'Auriculares',
    'especificaciones' => ['conexion' => 'usb_inalambrico'],
];
$auricularMicrofono = [
    'categoria' => 'Auriculares',
    'especificaciones' => ['microfono' => true],
];
$auricularAmbas = [
    'categoria' => 'Auriculares',
    'especificaciones' => ['conexion' => 'bluetooth', 'microfono' => true],
];
$conexionPertinente = clasificarIdoneidadFinalRecomendaciones($auricularConexion, 'auriculares para jugar', 'gaming');
comprobar($conexionPertinente['classification'] === 'candidate', 'conexión gaming pertinente admite candidato');
comprobar(str_contains($conexionPertinente['reason'], 'usb_inalambrico'), 'motivo cita el tipo de conexión real');
comprobar(str_contains($conexionPertinente['reason'], 'no latencia'), 'motivo limita lo que acredita la conexión');
comprobar(
    clasificarIdoneidadFinalRecomendaciones($auricularConexion, 'auriculares para gimnasio', 'entrenar')['classification'] === 'excluded',
    'conexión no gaming no admite candidato'
);
$microfonoVoz = clasificarIdoneidadFinalRecomendaciones($auricularMicrofono, 'auriculares para jugar con chat de voz', 'gaming');
comprobar($microfonoVoz['classification'] === 'candidate', 'micrófono admite candidato con necesidad explícita de voz');
comprobar(str_contains($microfonoVoz['reason'], 'dispone de micrófono'), 'motivo del micrófono es acotado');
comprobar(
    clasificarIdoneidadFinalRecomendaciones($auricularMicrofono, 'auriculares para jugar', 'gaming')['classification'] === 'excluded',
    'micrófono sin necesidad de voz no admite candidato'
);
$ambasSenales = clasificarIdoneidadFinalRecomendaciones($auricularAmbas, 'auriculares para jugar con chat de voz', 'gaming');
comprobar(str_contains($ambasSenales['reason'], 'conexión: bluetooth') && str_contains($ambasSenales['reason'], 'micrófono'), 'conexión y micrófono se evalúan como señales separadas');
comprobar($ambasSenales['classification'] === 'candidate', 'señales parciales nunca confirman idoneidad global');
$latenciaDesconocida = clasificarIdoneidadFinalRecomendaciones(
    ['categoria' => 'Auriculares', 'especificaciones' => ['conexion' => 'jack']],
    'auriculares para jugar',
    'gaming'
);
comprobar($latenciaDesconocida['classification'] === 'candidate', 'latencia desconocida no penaliza una conexión admitida');
comprobar(!str_contains($latenciaDesconocida['reason'], 'Latencia:'), 'latencia desconocida no se presenta como evidencia');
comprobar(
    clasificarIdoneidadFinalRecomendaciones(['categoria' => 'Auriculares', 'especificaciones' => ['conexion' => 'jack']], 'auriculares para jugar', 'gaming')['classification'] !== 'confirmed',
    'conexión parcial no confirma idoneidad'
);

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
    solicitudNecesitaComunicacionVozRecomendaciones('auriculares para jugar sin micrófono') ===
        solicitudNecesitaComunicacionVozRecomendaciones('Auriculares para jugar sin micrófono') &&
        solicitudNecesitaComunicacionVozRecomendaciones('no necesito voz') === 'negated',
    'normalización de acentos y mayúsculas conserva la negación'
);

foreach ([false, null, 'true', 1] as $valorMicrofonoNoValido) {
    $resultadoMicrofonoNoValido = clasificarIdoneidadFinalRecomendaciones(
        ['categoria' => 'Auriculares', 'especificaciones' => ['microfono' => $valorMicrofonoNoValido]],
        'auriculares para jugar con micrófono',
        'gaming'
    );
    comprobar(
        $resultadoMicrofonoNoValido['classification'] === 'excluded',
        'micrófono falso, ausente o de tipo inválido no aporta evidencia positiva'
    );
}
$microfonoAusente = clasificarIdoneidadFinalRecomendaciones(
    ['categoria' => 'Auriculares', 'especificaciones' => []],
    'auriculares para jugar con micrófono',
    'gaming'
);
comprobar($microfonoAusente['classification'] === 'excluded', 'micrófono ausente no admite candidato');
foreach (['auriculares para jugar sin micrófono', 'auriculares para jugar, no necesito voz', 'auriculares gaming quizá necesite micrófono', 'auriculares para jugar'] as $consultaSinNecesidadAfirmativa) {
    $resultadoSinNecesidad = clasificarIdoneidadFinalRecomendaciones(
        $auricularMicrofono,
        $consultaSinNecesidadAfirmativa,
        'gaming'
    );
    comprobar(
        $resultadoSinNecesidad['classification'] === 'excluded' &&
            !str_contains($resultadoSinNecesidad['reason'], 'dispone de micrófono'),
        'micrófono no se usa ante negación, ambigüedad o ausencia de petición'
    );
}
$conexionIndependienteVozNegada = clasificarIdoneidadFinalRecomendaciones(
    ['categoria' => 'Auriculares', 'especificaciones' => ['conexion' => 'jack', 'microfono' => true]],
    'auriculares para jugar sin micrófono',
    'gaming'
);
comprobar(
    $conexionIndependienteVozNegada['classification'] === 'candidate' &&
        str_contains($conexionIndependienteVozNegada['reason'], 'conexión: jack') &&
        !str_contains($conexionIndependienteVozNegada['reason'], 'dispone de micrófono'),
    'conexión sigue siendo independiente cuando se niega la necesidad de voz'
);
comprobar(
    clasificarIdoneidadFinalRecomendaciones($auricularAmbas, 'auriculares para jugar y hablar con mis amigos', 'gaming')['classification'] === 'candidate',
    'micrófono afirmativo con conexión nunca confirma idoneidad global'
);
comprobar(
    clasificarIdoneidadFinalRecomendaciones($portatilSemantico, 'portátil para jugar', 'gaming')['classification'] === 'excluded',
    'regresión: portátil gaming continúa excluido sin criterio de rendimiento'
);

$productoPublico = ['id' => 1, 'nombre' => 'Portátil de prueba', 'precio' => '999.00'];
$soloRecomendacionConfirmada = construirRespuestaMixtaRecomendaciones([
    ['id' => 1, 'classification' => 'confirmed', 'reason' => 'Motivo PHP verificado'],
], ['1' => $productoPublico]);
comprobar(count($soloRecomendacionConfirmada['recommendations']) === 1, 'contrato permite solo recomendaciones confirmadas');
comprobar($soloRecomendacionConfirmada['candidates'] === [], 'lista de candidatos vacía junto a confirmadas');

$soloCandidato = construirRespuestaMixtaRecomendaciones([
    ['id' => 1, 'classification' => 'candidate', 'reason' => 'Motivo PHP verificado'],
], ['1' => $productoPublico]);
comprobar($soloCandidato['recommendations'] === [], 'candidato no se presenta como confirmado');
comprobar(count($soloCandidato['candidates']) === 1, 'contrato permite solo candidatos inciertos');
comprobar(!isset($soloCandidato['message']), 'mensaje opcional cuando hay candidatos');

$ambasListas = construirRespuestaMixtaRecomendaciones([
    ['id' => 1, 'classification' => 'confirmed', 'reason' => 'Confirmación PHP'],
    ['id' => 2, 'classification' => 'candidate', 'reason' => 'Candidato PHP'],
], ['1' => $productoPublico, '2' => ['id' => 2, 'nombre' => 'Candidato']]);
comprobar(count($ambasListas['recommendations']) === 1 && count($ambasListas['candidates']) === 1, 'contrato devuelve ambas listas separadas');

$ambasVacias = construirRespuestaMixtaRecomendaciones([], []);
comprobar($ambasVacias['recommendations'] === [] && $ambasVacias['candidates'] === [], 'respuesta sin productos tiene ambas listas vacías');
comprobar(isset($ambasVacias['message']) && str_contains($ambasVacias['message'], 'No encontramos'), 'respuesta sin productos incluye mensaje informativo');

// Los filtros duros se aplican antes de clasificar, por lo que bloquean ambas listas.
foreach (['stock' => 0, 'precio' => '1000.01', 'categoria_id' => 8] as $campo => $valor) {
    $productoFiltrado = array_replace($portatilAsus, [$campo => $valor]);
    comprobar(!candidatoCumpleFiltrosDurosRecomendaciones($productoFiltrado, 100000, [4]), 'filtro duro excluye candidato por ' . $campo);
    comprobar(
        (function () use ($portatilAsus, $campo, $valor): bool {
            $productoFiltrado = array_replace($portatilAsus, [$campo => $valor]);
            if (candidatoCumpleFiltrosDurosRecomendaciones($productoFiltrado, 100000, [4])) {
                return false;
            }

            return construirRespuestaMixtaRecomendaciones(
            [
                ['id' => 1, 'classification' => 'confirmed', 'reason' => 'Motivo'],
                ['id' => 1, 'classification' => 'candidate', 'reason' => 'Motivo'],
            ],
            []
            )['recommendations'] === [] && construirRespuestaMixtaRecomendaciones(
                [
                    ['id' => 1, 'classification' => 'confirmed', 'reason' => 'Motivo'],
                    ['id' => 1, 'classification' => 'candidate', 'reason' => 'Motivo'],
                ],
                []
            )['candidates'] === [];
        })(),
        'filtro ' . $campo . ' bloquea ambas listas'
    );
}

echo "OK: {$comprobaciones} comprobaciones\n";
