<?php

declare(strict_types=1);

/** precio es DECIMAL(10,2): como máximo 99 999 999,99. */
const PRODUCTO_PRECIO_MAXIMO = 99999999.99;
/** stock es INT con signo; la restricción CHECK de la migración 002 exige stock >= 0. */
const PRODUCTO_STOCK_MAXIMO = 2147483647;

/**
 * Precio válido como texto normalizado («1299.90»), o null si no es un número
 * válido. Ya no convierte un texto como «abc» en 0.
 * Admite números JSON y textos con punto o coma decimal y como máximo dos decimales.
 */
function precioProductoValido(mixed $valor): ?string
{
    if (is_int($valor)) {
        $numero = (float) $valor;
    } elseif (is_float($valor)) {
        if (!is_finite($valor) || abs($valor * 100 - round($valor * 100)) > 1e-6) {
            return null;
        }
        $numero = $valor;
    } elseif (is_string($valor) && preg_match('/\A\d{1,8}(?:[.,]\d{1,2})?\z/', trim($valor)) === 1) {
        $numero = (float) str_replace(',', '.', trim($valor));
    } else {
        return null;
    }

    if ($numero < 0 || $numero > PRODUCTO_PRECIO_MAXIMO) {
        return null;
    }

    return number_format($numero, 2, '.', '');
}

/** Stock entero no negativo (número JSON o texto de dígitos), o null si no es válido. */
function stockProductoValido(mixed $valor): ?int
{
    if (is_int($valor)) {
        $stock = $valor;
    } elseif (is_string($valor) && preg_match('/\A\d{1,10}\z/', trim($valor)) === 1) {
        $stock = (int) trim($valor);
    } else {
        return null;
    }

    return $stock >= 0 && $stock <= PRODUCTO_STOCK_MAXIMO ? $stock : null;
}
