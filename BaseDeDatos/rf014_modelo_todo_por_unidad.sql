-- Migración: modelo "todo por unidad" (reemplaza empaquetado/fraccionable)
-- Afecta RF-005, RF-007, RF-014, RF-015, RF-019, RF-021.
-- Referencia de diseño: docs/proyecto/rediseno_modelo_producto.md
--
-- ATENCIÓN: migración DESTRUCTIVA. Elimina los productos fraccionables
-- existentes (decisión del proyecto: no hay conversión unívoca de su stock
-- en unidad base a "unidades"). Ejecutar sobre una base respaldada.

BEGIN;

-- 1) Eliminar los productos fraccionables y sus precios por volumen.
--    Nota: si algún producto fraccionable está referenciado por pedidos,
--    propuestas de sustitución, precios de proveedor o pedidos de reposición,
--    la FK impedirá el DELETE. En ese caso, resolver primero esos registros.
DELETE FROM precio_volumen
 WHERE producto_id IN (SELECT id FROM producto WHERE tipo_producto = 'fraccionable');

DELETE FROM producto
 WHERE tipo_producto = 'fraccionable';

-- 2) Nuevo enum para la unidad del peso/longitud (opcional).
CREATE TYPE producto_magnitud_unidad AS ENUM ('kg', 'g', 'ml', 'l', 'cm', 'm');

-- 3) Nuevas columnas: marca (opcional) y peso/longitud (opcional).
ALTER TABLE producto
  ADD COLUMN marca VARCHAR,
  ADD COLUMN magnitud_valor DECIMAL,
  ADD COLUMN magnitud_unidad producto_magnitud_unidad;

-- 4) Quitar las columnas del modelo empaquetado/fraccionable.
ALTER TABLE producto
  DROP COLUMN tipo_producto,
  DROP COLUMN descripcion_unidad_venta,
  DROP COLUMN unidad_base_interna,
  DROP COLUMN incremento_venta,
  DROP COLUMN metrica_visualizacion;

-- 5) Quitar los enums que ya no se usan.
DROP TYPE producto_tipo;
DROP TYPE producto_unidad_base;
DROP TYPE producto_metrica_visualizacion;

-- 6) La cantidad pasa a expresarse siempre en unidades enteras.
ALTER TABLE producto
  ALTER COLUMN cantidad_minima_compra TYPE INTEGER USING cantidad_minima_compra::integer,
  ALTER COLUMN cantidad_minima_compra SET DEFAULT 1;

ALTER TABLE precio_volumen
  ALTER COLUMN cantidad_minima TYPE INTEGER USING cantidad_minima::integer;

COMMIT;
