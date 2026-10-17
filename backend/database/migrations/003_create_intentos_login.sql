-- Requiere MariaDB 10.4 o posterior.
-- Registro de intentos de login fallidos para limitar los ataques de fuerza bruta:
-- como máximo 5 fallos por email y por IP en 15 minutos (ver backend/usuarios/limite_login.php).
-- El email se guarda como hash SHA-256 en hexadecimal, nunca en claro.
-- Aplicar primero en una base de datos de prueba y, tras copia de seguridad, en la real.

CREATE TABLE intentos_login (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email_hash CHAR(64) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_intentos_login_email (email_hash, creado_en),
    KEY idx_intentos_login_ip (ip, creado_en)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Reversión:
--   DROP TABLE intentos_login;
