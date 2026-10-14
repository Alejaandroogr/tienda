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

echo "OK: 5 casos de actualización parcial\n";
