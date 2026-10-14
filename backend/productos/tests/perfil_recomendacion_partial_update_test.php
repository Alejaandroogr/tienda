<?php

declare(strict_types=1);

require_once __DIR__ . '/../perfil_recomendacion.php';

function afirmar(bool $condicion, string $caso): void
{
    if (!$condicion) {
        throw new RuntimeException('Falló: ' . $caso);
    }
}

function perfilAtributosParciales(): stdClass
{
    return (object) ['atributos' => (object) ['pantalla_pulgadas' => 13.6]];
}

$usosMacBook = '{"programacion":"adecuado","trabajo":"adecuado","edicion":"adecuado"}';

// Una actualización técnica omite usos: conserva exactamente los usos previos.
$perfilConservado = completarUsosOmitidosEdicionPerfilRecomendacion(
    perfilAtributosParciales(),
    $usosMacBook,
    false
);
afirmar(
    get_object_vars($perfilConservado->usos) === [
        'programacion' => 'adecuado',
        'trabajo' => 'adecuado',
        'edicion' => 'adecuado',
    ],
    'usos existentes conservados en edición de misma categoría'
);

// Un campo usos expresamente enviado prevalece y continúa sujeto al validador actual.
$perfilExpreso = (object) [
    'usos' => (object) ['gaming' => 'adecuado'],
    'atributos' => (object) [],
];
$resultadoExpreso = completarUsosOmitidosEdicionPerfilRecomendacion(
    $perfilExpreso,
    $usosMacBook,
    false
);
$validadoExpreso = validarPerfilRecomendacion($resultadoExpreso, 'Portátiles');
afirmar($validadoExpreso['usos'] === ['gaming' => 'adecuado'], 'usos expresos validados y aplicados');

try {
    validarPerfilRecomendacion(
        completarUsosOmitidosEdicionPerfilRecomendacion(
            (object) ['usos' => (object) ['gimnasio' => 'adecuado'], 'atributos' => (object) []],
            $usosMacBook,
            false
        ),
        'Portátiles'
    );
    throw new RuntimeException('Falló: la validación existente de usos inválidos no se aplicó');
} catch (ErrorPerfilRecomendacion $error) {
    afirmar($error->codigo === 'invalid_use', 'usos expresos siguen usando la validación vigente');
}

// Sin fila previa, el perfil nuevo comienza con usos vacío.
$perfilSinFila = completarUsosOmitidosEdicionPerfilRecomendacion(
    perfilAtributosParciales(),
    null,
    false
);
afirmar($perfilSinFila->usos instanceof stdClass && get_object_vars($perfilSinFila->usos) === [], 'perfil inexistente inicializa usos vacío');

// El cambio de categoría nunca arrastra usos de la categoría anterior.
$perfilCategoriaNueva = completarUsosOmitidosEdicionPerfilRecomendacion(
    perfilAtributosParciales(),
    $usosMacBook,
    true
);
afirmar(
    $perfilCategoriaNueva->usos instanceof stdClass && get_object_vars($perfilCategoriaNueva->usos) === [],
    'cambio de categoría descarta usos anteriores cuando se omiten'
);

$atributosMacBook = '{"cpu_modelo":"Apple M5","ram_gb":16,"gpu_tipo":"integrada"}';

// Una edición que solo envía usos conserva exactamente los atributos previos.
$perfilSoloUsos = completarAtributosOmitidosEdicionPerfilRecomendacion(
    (object) ['usos' => (object) ['gaming' => 'no_recomendado']],
    $atributosMacBook,
    false
);
afirmar(
    get_object_vars($perfilSoloUsos->atributos) === ['cpu_modelo' => 'Apple M5', 'ram_gb' => 16, 'gpu_tipo' => 'integrada'],
    'atributos existentes conservados en edición de misma categoría'
);
afirmar(
    validarPerfilRecomendacion($perfilSoloUsos, 'Portátiles')['atributos']['ram_gb'] === 16,
    'atributos conservados siguen pasando el validador'
);

// El cambio de categoría nunca arrastra atributos de la categoría anterior.
$perfilAtributosCategoriaNueva = completarAtributosOmitidosEdicionPerfilRecomendacion(
    (object) ['usos' => new stdClass()],
    $atributosMacBook,
    true
);
afirmar(
    get_object_vars($perfilAtributosCategoriaNueva->atributos) === [],
    'cambio de categoría descarta atributos anteriores cuando se omiten'
);

// Atributos expresos prevalecen sobre los almacenados.
$perfilAtributosExpresos = completarAtributosOmitidosEdicionPerfilRecomendacion(
    (object) ['atributos' => (object) ['ram_gb' => 32]],
    $atributosMacBook,
    false
);
afirmar(get_object_vars($perfilAtributosExpresos->atributos) === ['ram_gb' => 32], 'atributos expresos no se mezclan con los almacenados');

// Esquema alineado con el frontend: campos de rendimiento de gráficas y procesadores.
afirmar(
    validarPerfilRecomendacion(
        (object) ['atributos' => (object) ['vram_gb' => 12, 'rendimiento_gaming' => 'alta']],
        'Tarjetas gráficas'
    )['atributos'] === ['vram_gb' => 12, 'rendimiento_gaming' => 'alta'],
    'rendimiento_gaming aceptado en tarjetas gráficas'
);
afirmar(
    validarPerfilRecomendacion(
        (object) ['atributos' => (object) ['nucleos' => 8, 'rendimiento' => 'media']],
        'Procesadores'
    )['atributos'] === ['nucleos' => 8, 'rendimiento' => 'media'],
    'rendimiento aceptado en procesadores'
);

// Categorías con y sin esquema.
afirmar(categoriaAdmitePerfilRecomendacion('Tarjetas gráficas'), 'tarjetas gráficas admite perfil');
afirmar(categoriaAdmitePerfilRecomendacion('Televisores'), 'televisores admite perfil');
afirmar(!categoriaAdmitePerfilRecomendacion('Accesorios'), 'categoría sin esquema no admite perfil');

// Detección de perfil vacío.
afirmar(perfilRecomendacionVacio(null), 'null es perfil vacío');
afirmar(perfilRecomendacionVacio((object) ['usos' => new stdClass(), 'atributos' => new stdClass()]), 'usos y atributos vacíos');
afirmar(perfilRecomendacionVacio((object) ['atributos' => (object) ['ram_gb' => null]]), 'solo valores null es vacío');
afirmar(!perfilRecomendacionVacio((object) ['atributos' => (object) ['ram_gb' => 16]]), 'atributo con valor no es vacío');
afirmar(!perfilRecomendacionVacio((object) ['usos' => (object) ['gaming' => 'adecuado']]), 'uso con valor no es vacío');
afirmar(!perfilRecomendacionVacio((object) ['atributos' => 'texto']), 'tipo inválido no se trata como vacío');

// Planificación del perfil al crear o editar un producto.
afirmar(planificarPerfilProductoRecomendacion(true, (object) ['atributos' => new stdClass()], false, false) === 'ninguna', 'perfil vacío en categoría sin esquema se ignora');
afirmar(planificarPerfilProductoRecomendacion(false, null, false, false) === 'ninguna', 'sin perfil en categoría sin esquema no hace nada');
afirmar(planificarPerfilProductoRecomendacion(false, null, false, true) === 'eliminar', 'mover a categoría sin esquema elimina el perfil');
afirmar(planificarPerfilProductoRecomendacion(true, (object) ['atributos' => new stdClass()], false, true) === 'eliminar', 'mover con perfil vacío a categoría sin esquema elimina el perfil');
afirmar(planificarPerfilProductoRecomendacion(true, (object) ['atributos' => new stdClass()], true, false) === 'guardar', 'perfil enviado en categoría con esquema se guarda');
afirmar(planificarPerfilProductoRecomendacion(false, null, true, true) === 'restablecer', 'mover sin perfil a categoría con esquema lo restablece');
afirmar(planificarPerfilProductoRecomendacion(false, null, true, false) === 'ninguna', 'sin perfil enviado y sin cambio de categoría no se toca el perfil');

try {
    planificarPerfilProductoRecomendacion(true, (object) ['atributos' => (object) ['ram_gb' => 16]], false, false);
    throw new RuntimeException('Falló: un perfil con datos en una categoría sin esquema debe rechazarse');
} catch (ErrorPerfilRecomendacion $error) {
    afirmar($error->codigo === 'invalid_category' && $error->estadoHttp === 422, 'perfil con datos en categoría sin esquema se rechaza con 422');
}

echo "OK: 28 comprobaciones de actualización parcial y planificación de perfil\n";
