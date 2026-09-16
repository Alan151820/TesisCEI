
BEGIN;

DELETE FROM precio_volumen
 WHERE producto_id IN (SELECT id FROM producto WHERE tipo_producto = 'fraccionable');

DELETE FROM producto
 WHERE tipo_producto = 'fraccionable';

CREATE TYPE producto_magnitud_unidad AS ENUM ('kg', 'g', 'ml', 'l', 'cm', 'm');

ALTER TABLE producto
  ADD COLUMN marca VARCHAR,
  ADD COLUMN magnitud_valor DECIMAL,
  ADD COLUMN magnitud_unidad producto_magnitud_unidad;

ALTER TABLE producto
  DROP COLUMN tipo_producto,
  DROP COLUMN descripcion_unidad_venta,
  DROP COLUMN unidad_base_interna,
  DROP COLUMN incremento_venta,
  DROP COLUMN metrica_visualizacion;

DROP TYPE producto_tipo;
DROP TYPE producto_unidad_base;
DROP TYPE producto_metrica_visualizacion;

ALTER TABLE producto
  ALTER COLUMN cantidad_minima_compra TYPE INTEGER USING cantidad_minima_compra::integer,
  ALTER COLUMN cantidad_minima_compra SET DEFAULT 1;

ALTER TABLE precio_volumen
  ALTER COLUMN cantidad_minima TYPE INTEGER USING cantidad_minima::integer;

COMMIT;
