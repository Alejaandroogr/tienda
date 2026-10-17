-- Requiere MariaDB 10.2.1 o posterior (restricciones CHECK aplicadas).
-- Impide que el stock de un producto quede en negativo, como segunda barrera
-- frente a la sobreventa (además de la validación de pedidos/crear.php).
--
-- Antes de aplicarla, comprueba que no hay productos con stock negativo
-- (la migración fallaría):
--   SELECT id, nombre, stock FROM productos WHERE stock < 0;
-- Aplicar primero en una base de datos de prueba y, tras aprobación, en la real.

ALTER TABLE productos
    ADD CONSTRAINT chk_productos_stock_no_negativo
    CHECK (stock >= 0);

-- Reversión:
--   ALTER TABLE productos DROP CONSTRAINT chk_productos_stock_no_negativo;
