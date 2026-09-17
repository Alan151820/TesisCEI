-- El archivo está en UTF-8. Forzar el encoding del cliente evita que una
-- importación desde una terminal Windows (cuyo default es WIN1252) corrompa
-- los caracteres acentuados (tildes, ñ) por doble codificación.
SET client_encoding = 'UTF8';

CREATE TYPE codigo_verificacion_proposito AS ENUM (
  'activacion_cuenta',
  'recuperacion_password'
);

CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  nombre_completo VARCHAR NOT NULL,
  telefono VARCHAR UNIQUE NOT NULL,
  contrasena_hash VARCHAR NOT NULL,
  modo_distribuidor_activo BOOLEAN NOT NULL DEFAULT FALSE,
  cuenta_verificada BOOLEAN NOT NULL DEFAULT FALSE,
  consentimiento_datos_otorgado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  -- RNF-010 (Ley 18.331): ninguna cuenta puede terminar de crearse sin
  -- el consentimiento otorgado.
  CONSTRAINT usuario_consentimiento_otorgado CHECK (consentimiento_datos_otorgado = true)
);

CREATE TABLE codigo_verificacion (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id),
  codigo VARCHAR NOT NULL,
  proposito codigo_verificacion_proposito NOT NULL,
  fecha_expiracion TIMESTAMP NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- RF-014: Carga de producto nuevo
-- RF-012: Modo distribuidor
-- RF-042: dirección de partida del depósito (latitud/longitud)
-- RF-049: logo del distribuidor

CREATE TABLE distribuidor (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuario(id),
  nombre_comercial VARCHAR NOT NULL,
  descripcion_negocio TEXT,
  zona_entrega VARCHAR,
  direccion_partida VARCHAR,
  perfil_configurado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  logo_url VARCHAR,
  latitud DECIMAL,
  longitud DECIMAL
);

CREATE TYPE producto_estado AS ENUM ('publicado', 'pausado');
-- RF-014: modelo "todo por unidad" — reemplaza al modelo anterior
-- (empaquetado/fraccionable, con unidad_base_interna/incremento_venta/
-- metrica_visualizacion), que ya no está vigente.
CREATE TYPE producto_magnitud_unidad AS ENUM ('kg', 'g', 'ml', 'l', 'cm', 'm');

CREATE TABLE categoria (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR UNIQUE NOT NULL
);

INSERT INTO categoria (nombre) VALUES
  ('Lácteos'),
  ('Carnes'),
  ('Verduras y frutas'),
  ('Panadería'),
  ('Bebidas'),
  ('Limpieza'),
  ('Enlatados'),
  ('Congelados'),
  ('Otros');

CREATE TABLE producto (
  id SERIAL PRIMARY KEY,
  distribuidor_id INTEGER NOT NULL REFERENCES distribuidor(id),
  categoria_id INTEGER NOT NULL REFERENCES categoria(id),
  nombre VARCHAR NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR,
  estado_visibilidad producto_estado NOT NULL DEFAULT 'pausado',
  stock_total INTEGER NOT NULL DEFAULT 0,
  stock_reservado INTEGER NOT NULL DEFAULT 0,
  umbral_minimo_stock INTEGER,
  habilitado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  marca VARCHAR,
  magnitud_valor DECIMAL,
  magnitud_unidad producto_magnitud_unidad
);

-- RF-015: Registro de precio por volumen
CREATE TABLE precio_volumen (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES producto(id),
  cantidad_minima INTEGER NOT NULL,
  precio_venta DECIMAL NOT NULL,
  precio_costo DECIMAL,
  CONSTRAINT precio_venta_positivo CHECK (precio_venta > 0),
  CONSTRAINT cantidad_minima_positiva CHECK (cantidad_minima > 0),
  CONSTRAINT precio_costo_no_negativo CHECK (precio_costo IS NULL OR precio_costo >= 0),
  -- RF-015: no puede haber dos precios por volumen con la misma cantidad
  -- mínima para el mismo producto (incluida la cantidad mínima 1, el precio base).
  CONSTRAINT precio_volumen_producto_cantidad_unica UNIQUE (producto_id, cantidad_minima)
);

-- RF-008: Confirmación de pedido
-- RF-069: 'cancelado' — cancelación de pedido por el comprador
CREATE TYPE pedido_estado AS ENUM ('pendiente', 'aceptado', 'en_camino', 'entregado', 'rechazado', 'cancelado');

CREATE TABLE pedido (
  id SERIAL PRIMARY KEY,
  comprador_id INTEGER NOT NULL REFERENCES usuario(id),
  distribuidor_id INTEGER NOT NULL REFERENCES distribuidor(id),
  direccion_entrega VARCHAR NOT NULL,
  latitud DECIMAL,
  longitud DECIMAL,
  estado pedido_estado NOT NULL DEFAULT 'pendiente',
  motivo_rechazo VARCHAR,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_entregado TIMESTAMP
);

CREATE TABLE pedido_item (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedido(id),
  producto_id INTEGER NOT NULL REFERENCES producto(id),
  precio_volumen_id INTEGER NOT NULL REFERENCES precio_volumen(id),
  cantidad DECIMAL NOT NULL,
  precio_venta_congelado DECIMAL NOT NULL
);

-- RF-043 a RF-067: planificación y gestión de repartos
CREATE TYPE plan_reparto_estado AS ENUM ('sin_empezar', 'en_curso', 'finalizado');

CREATE TABLE plan_reparto (
  id SERIAL PRIMARY KEY,
  distribuidor_id INTEGER NOT NULL REFERENCES distribuidor(id),
  estado plan_reparto_estado NOT NULL DEFAULT 'sin_empezar',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  -- RF-071: último punto reportado por el celular del distribuidor
  -- mientras el reparto está "en_curso". No se guarda historial, solo el
  -- último punto conocido.
  ultima_latitud DECIMAL,
  ultima_longitud DECIMAL,
  ultima_ubicacion_fecha TIMESTAMP
);

CREATE TYPE parada_reparto_estado AS ENUM ('pendiente', 'entregado', 'omitido', 'rechazado');

CREATE TABLE parada_reparto (
  id SERIAL PRIMARY KEY,
  plan_reparto_id INTEGER NOT NULL REFERENCES plan_reparto(id),
  pedido_id INTEGER NOT NULL REFERENCES pedido(id),
  orden INTEGER NOT NULL,
  estado_parada parada_reparto_estado NOT NULL DEFAULT 'pendiente',
  motivo VARCHAR
);

-- Un mismo pedido no puede tener más de una parada activa (estado distinto
-- de 'omitido') a la vez: evita que quede en dos planes de reparto en curso
-- al mismo tiempo.
CREATE UNIQUE INDEX parada_reparto_pedido_id_activo_key ON parada_reparto (pedido_id) WHERE (estado_parada <> 'omitido');

-- RF-024: Notificación de pedido entrante al distribuidor
CREATE TYPE notificacion_tipo AS ENUM ('cambio_estado_pedido', 'pedido_entrante', 'stock_bajo');

CREATE TABLE notificacion (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id),
  pedido_id INTEGER REFERENCES pedido(id),
  tipo notificacion_tipo NOT NULL,
  mensaje VARCHAR NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);
