<?php

declare(strict_types=1);

/**
 * Límite de intentos de login: como máximo LOGIN_MAX_INTENTOS fallos por email y
 * por IP en LOGIN_VENTANA_MINUTOS. Tabla: intentos_login (migración 003).
 */

const LOGIN_MAX_INTENTOS = 5;
const LOGIN_VENTANA_MINUTOS = 15;

/** El email se compara normalizado y se guarda solo como hash. */
function hashEmailLogin(string $email): string
{
    return hash('sha256', mb_strtolower(trim($email), 'UTF-8'));
}

/** IP de la conexión. No se usan cabeceras como X-Forwarded-For: las controla el cliente. */
function ipClienteLogin(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');

    return filter_var($ip, FILTER_VALIDATE_IP) !== false ? $ip : 'desconocida';
}

function loginBloqueado(PDO $pdo, string $email, string $ip): bool
{
    $consulta = $pdo->prepare(
        'SELECT
            SUM(email_hash = :email_hash) AS por_email,
            SUM(ip = :ip) AS por_ip
         FROM intentos_login
         WHERE creado_en >= NOW() - INTERVAL ' . LOGIN_VENTANA_MINUTOS . ' MINUTE
           AND (email_hash = :email_hash_filtro OR ip = :ip_filtro)'
    );
    $hash = hashEmailLogin($email);
    $consulta->execute([':email_hash' => $hash, ':ip' => $ip, ':email_hash_filtro' => $hash, ':ip_filtro' => $ip]);
    $fila = $consulta->fetch(PDO::FETCH_ASSOC) ?: [];

    return (int) ($fila['por_email'] ?? 0) >= LOGIN_MAX_INTENTOS
        || (int) ($fila['por_ip'] ?? 0) >= LOGIN_MAX_INTENTOS;
}

function registrarFalloLogin(PDO $pdo, string $email, string $ip): void
{
    $pdo->prepare('INSERT INTO intentos_login (email_hash, ip) VALUES (:email_hash, :ip)')
        ->execute([':email_hash' => hashEmailLogin($email), ':ip' => $ip]);

    // Limpieza: los intentos de más de un día ya no cuentan para nada.
    $pdo->exec('DELETE FROM intentos_login WHERE creado_en < NOW() - INTERVAL 1 DAY');
}

/** Tras un login correcto, los fallos de ese email dejan de contar (los de la IP se mantienen). */
function limpiarFallosLoginEmail(PDO $pdo, string $email): void
{
    $pdo->prepare('DELETE FROM intentos_login WHERE email_hash = :email_hash')
        ->execute([':email_hash' => hashEmailLogin($email)]);
}
