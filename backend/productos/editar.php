<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/perfil_recomendacion.php';

exigirAdministrador();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);

    echo json_encode([
        'error' => 'Método no permitido'
    ]);

    exit;
}

$cuerpo = file_get_contents('php://input');

try {
    $datosJson = json_decode($cuerpo === false ? '' : $cuerpo, false, 32, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    enviarErrorPerfilRecomendacion('invalid_json', 'El cuerpo no contiene JSON válido', 400);
}

if (!$datosJson instanceof stdClass) {
    enviarErrorPerfilRecomendacion('invalid_type', 'La solicitud debe ser un objeto JSON', 400);
}

$datos = get_object_vars($datosJson);
$camposPermitidos = [
    'id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'categoria_id', 'perfil_ia',
];

if (array_diff(array_keys($datos), $camposPermitidos) !== []) {
    enviarErrorPerfilRecomendacion(
        'invalid_request',
        'La solicitud contiene campos no permitidos',
        400
    );
}

if (
    !isset($datos['id']) || (!is_string($datos['id']) && !is_int($datos['id'])) ||
    !isset($datos['nombre']) || !is_string($datos['nombre']) ||
    !isset($datos['descripcion']) || !is_string($datos['descripcion']) ||
    !isset($datos['precio']) || (!is_string($datos['precio']) && !is_int($datos['precio']) && !is_float($datos['precio'])) ||
    !isset($datos['stock']) || (!is_string($datos['stock']) && !is_int($datos['stock'])) ||
    !isset($datos['categoria_id']) || (!is_string($datos['categoria_id']) && !is_int($datos['categoria_id']))
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Faltan datos obligatorios'
    ]);

    exit;
}

$id = (int) $datos['id'];
$nombre = trim($datos['nombre']);
$descripcion = trim($datos['descripcion']);
$precio = (float) $datos['precio'];
$stock = (int) $datos['stock'];
$categoriaId = (int) $datos['categoria_id'];

if (array_key_exists('perfil_ia', $datos) && $datos['perfil_ia'] !== null && !$datos['perfil_ia'] instanceof stdClass) {
    enviarErrorPerfilRecomendacion('invalid_type', 'perfil_ia debe ser un objeto JSON o null', 400);
}

if (array_key_exists('imagen', $datos) && $datos['imagen'] !== null && !is_string($datos['imagen'])) {
    enviarErrorPerfilRecomendacion('invalid_type', 'imagen debe ser texto o null', 400);
}

$imagen = null;

if (isset($datos['imagen'])) {
    $imagen = trim($datos['imagen']);

    if ($imagen === '') {
        $imagen = null;
    }
}

if (
    $id <= 0 ||
    $nombre === '' ||
    $descripcion === '' ||
    $precio < 0 ||
    $stock < 0 ||
    $categoriaId <= 0
) {
    http_response_code(400);

    echo json_encode([
        'error' => 'Los datos del producto no son válidos'
    ]);

    exit;
}

$categoriaCambio = false;

try {
    $pdo->beginTransaction();

    // Bloquear producto y obtener la categoría actual directamente desde MariaDB.
    $sqlProducto = "
        SELECT id, categoria_id
        FROM productos
        WHERE id = :id
        LIMIT 1
        FOR UPDATE
    ";

    $stmtProducto = $pdo->prepare($sqlProducto);

    $stmtProducto->execute([
        ':id' => $id
    ]);

    $producto = $stmtProducto->fetch(PDO::FETCH_ASSOC);

    if (!$producto) {
        throw new ErrorPerfilRecomendacion(
            'product_not_found',
            'Producto no encontrado',
            404
        );
    }

    // Comprobar que la categoría existe
    $sqlCategoria = "
        SELECT id, nombre
        FROM categorias
        WHERE id = :categoria_id
        LIMIT 1
    ";

    $stmtCategoria = $pdo->prepare($sqlCategoria);

    $stmtCategoria->execute([
        ':categoria_id' => $categoriaId
    ]);

    $categoria = $stmtCategoria->fetch(PDO::FETCH_ASSOC);

    if (!$categoria) {
        throw new ErrorPerfilRecomendacion(
            'invalid_category',
            'La categoría del producto no existe',
            422
        );
    }

    // Actualizar producto
    $sql = "
        UPDATE productos
        SET
            nombre = :nombre,
            descripcion = :descripcion,
            precio = :precio,
            stock = :stock,
            imagen = :imagen,
            categoria_id = :categoria_id
        WHERE id = :id
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':nombre' => $nombre,
        ':descripcion' => $descripcion,
        ':precio' => $precio,
        ':stock' => $stock,
        ':imagen' => $imagen,
        ':categoria_id' => $categoriaId,
        ':id' => $id
    ]);

    $perfilSolicitado = $datos['perfil_ia'] ?? null;
    $categoriaCambio = (int) $producto['categoria_id'] !== $categoriaId;
    $accionPerfil = planificarPerfilProductoRecomendacion(
        array_key_exists('perfil_ia', $datos),
        $perfilSolicitado,
        categoriaAdmitePerfilRecomendacion((string) $categoria['nombre']),
        $categoriaCambio
    );

    if (
        $accionPerfil === 'guardar' &&
        $perfilSolicitado instanceof stdClass &&
        (!property_exists($perfilSolicitado, 'usos') || !property_exists($perfilSolicitado, 'atributos'))
    ) {
        $perfilExistente = false;

        if (!$categoriaCambio) {
            $consultaPerfilExistente = $pdo->prepare(
                'SELECT usos, atributos
                 FROM perfil_recomendacion_producto
                 WHERE producto_id = :id AND categoria_id = :categoria_id
                 FOR UPDATE'
            );
            $consultaPerfilExistente->execute([
                ':id' => $id,
                ':categoria_id' => (int) $producto['categoria_id'],
            ]);
            $perfilExistente = $consultaPerfilExistente->fetch(PDO::FETCH_ASSOC);
        }

        $perfilSolicitado = completarUsosOmitidosEdicionPerfilRecomendacion(
            $perfilSolicitado,
            is_array($perfilExistente) && is_string($perfilExistente['usos']) ? $perfilExistente['usos'] : null,
            $categoriaCambio
        );
        $perfilSolicitado = completarAtributosOmitidosEdicionPerfilRecomendacion(
            $perfilSolicitado,
            is_array($perfilExistente) && is_string($perfilExistente['atributos']) ? $perfilExistente['atributos'] : null,
            $categoriaCambio
        );
    }

    if ($accionPerfil === 'guardar') {
        guardarPerfilRecomendacion(
            $pdo,
            $id,
            $perfilSolicitado ?? (object) ['usos' => new stdClass(), 'atributos' => new stdClass()]
        );
    } elseif ($accionPerfil === 'eliminar') {
        // La nueva categoría no admite perfil IA: el perfil de la anterior deja de ser válido.
        $eliminarPerfil = $pdo->prepare(
            'DELETE FROM perfil_recomendacion_producto WHERE producto_id = :id'
        );
        $eliminarPerfil->execute([':id' => $id]);
    } elseif ($accionPerfil === 'restablecer') {
        $consultaPerfil = $pdo->prepare(
            'SELECT categoria_id FROM perfil_recomendacion_producto WHERE producto_id = :id'
        );
        $consultaPerfil->execute([':id' => $id]);
        $categoriaPerfil = $consultaPerfil->fetchColumn();

        if ($categoriaPerfil !== false) {
            guardarPerfilRecomendacion(
                $pdo,
                $id,
                (object) ['usos' => new stdClass(), 'atributos' => new stdClass()]
            );
        }
    }

    $pdo->commit();

    echo json_encode([
        'mensaje' => 'Producto actualizado correctamente'
    ]);

} catch (ErrorPerfilRecomendacion $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    enviarErrorPerfilRecomendacion($error->codigo, $error->getMessage(), $error->estadoHttp);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('No se pudo actualizar el producto: ' . $error->getMessage());
    if (array_key_exists('perfil_ia', $datos) || $categoriaCambio) {
        enviarErrorPerfilRecomendacion('profile_save_failed', 'No se pudo guardar el producto y su perfil IA', 500);
    }

    http_response_code(500);
    echo json_encode(['error' => 'Error al actualizar el producto']);
}
