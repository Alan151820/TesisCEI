CREATE TYPE notificacion_tipo AS ENUM (
  'cambio_estado_pedido',
  'pedido_entrante',
  'stock_bajo'
);

CREATE TABLE notificacion (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id),
  pedido_id INTEGER REFERENCES pedido(id),
  tipo notificacion_tipo NOT NULL,
  mensaje VARCHAR NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT false,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE producto
  ADD CONSTRAINT chk_umbral_no_negativo CHECK (umbral_minimo_stock >= 0);
