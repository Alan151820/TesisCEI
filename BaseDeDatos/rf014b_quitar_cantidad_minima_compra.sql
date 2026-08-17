-- Ajuste del modelo "todo por unidad": se elimina cantidad_minima_compra.
-- La venta mínima queda implícita en 1 unidad (el precio base, precio_volumen
-- con cantidad_minima = 1, es el precio de la presentación).
-- Referencia: docs/proyecto/rediseno_modelo_producto.md

ALTER TABLE producto DROP COLUMN cantidad_minima_compra;
