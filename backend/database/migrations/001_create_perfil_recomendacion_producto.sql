-- Requiere MariaDB 10.4.32 o posterior.
-- Aplicar primero en una base de datos de prueba y, tras aprobación,
-- mediante el procedimiento de despliegue acordado.
-- La creación/edición de producto y perfil deberá ejecutarse en una
-- transacción y mantener categoria_id sincronizado con productos.

CREATE TABLE perfil_recomendacion_producto (
    producto_id INT(11) NOT NULL,
    categoria_id INT(11) NOT NULL,
    usos JSON NOT NULL,
    atributos JSON NOT NULL,
    actualizado_en TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (producto_id),
    KEY idx_perfil_recomendacion_categoria (categoria_id),
    CONSTRAINT fk_perfil_recomendacion_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_perfil_recomendacion_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_perfil_recomendacion_usos_objeto
        CHECK (JSON_TYPE(usos) = 'OBJECT'),
    CONSTRAINT chk_perfil_recomendacion_atributos_objeto
        CHECK (JSON_TYPE(atributos) = 'OBJECT')
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

DELIMITER //

CREATE TRIGGER bi_perfil_recomendacion_categoria
BEFORE INSERT ON perfil_recomendacion_producto
FOR EACH ROW
BEGIN
    DECLARE producto_existe INT DEFAULT 0;
    DECLARE categoria_producto INT DEFAULT NULL;

    SELECT COUNT(*), MAX(categoria_id)
      INTO producto_existe, categoria_producto
      FROM productos
     WHERE id = NEW.producto_id;

    IF producto_existe = 0 OR categoria_producto <> NEW.categoria_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La categoría del perfil no coincide con la del producto';
    END IF;
END//

CREATE TRIGGER bu_perfil_recomendacion_categoria
BEFORE UPDATE ON perfil_recomendacion_producto
FOR EACH ROW
BEGIN
    DECLARE producto_existe INT DEFAULT 0;
    DECLARE categoria_producto INT DEFAULT NULL;

    SELECT COUNT(*), MAX(categoria_id)
      INTO producto_existe, categoria_producto
      FROM productos
     WHERE id = NEW.producto_id;

    IF producto_existe = 0 OR categoria_producto <> NEW.categoria_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La categoría del perfil no coincide con la del producto';
    END IF;
END//

DELIMITER ;
