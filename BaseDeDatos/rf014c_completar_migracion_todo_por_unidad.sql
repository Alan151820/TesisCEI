-- Completa la migración "todo por unidad" que rf014_modelo_todo_por_unidad.sql
-- y rf014b_quitar_cantidad_minima_compra.sql dejaron a medias en esta base:
-- marca/magnitud_valor/magnitud_unidad ya existen, pero las columnas viejas
-- (tipo_producto NOT NULL entre ellas) seguían presentes y rompían cualquier
-- alta de producto nueva.
--
-- Verificado contra los datos reales antes de escribir esto:
--   - los 7 productos existentes son todos tipo_producto = 'empaquetado'
--     (0 fraccionable, no hay filas que perder)
--   - magnitud_unidad es NULL en las 7 filas (cast a enum seguro)
--   - precio_volumen.cantidad_minima no tiene valores no enteros (cast seguro)
--
-- No borra ninguna fila de producto/distribuidor/pedido/usuario.

BEGIN;

-- 1) Enum que faltaba para magnitud_unidad
CREATE TYPE producto_magnitud_unidad AS ENUM ('kg', 'g', 'ml', 'l', 'cm', 'm');

-- 2) Convertir magnitud_unidad de varchar a este enum
ALTER TABLE producto
  ALTER COLUMN magnitud_unidad TYPE producto_magnitud_unidad
  USING magnitud_unidad::producto_magnitud_unidad;

-- 3) Quitar las columnas del modelo viejo empaquetado/fraccionable
--    (reemplazado por marca + magnitud_valor + magnitud_unidad)
ALTER TABLE producto
  DROP COLUMN tipo_producto,
  DROP COLUMN descripcion_unidad_venta,
  DROP COLUMN unidad_base_interna,
  DROP COLUMN incremento_venta,
  DROP COLUMN metrica_visualizacion;

-- 4) Quitar los enums que ya no se usan
DROP TYPE producto_tipo;
DROP TYPE producto_unidad_base;
DROP TYPE producto_metrica_visualizacion;

-- 5) cantidad_minima pasa a entero, como espera el modelo final
ALTER TABLE precio_volumen
  ALTER COLUMN cantidad_minima TYPE INTEGER USING cantidad_minima::integer;

COMMIT;
