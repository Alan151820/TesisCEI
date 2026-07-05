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
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
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

CREATE TABLE distribuidor (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuario(id),
  nombre_comercial VARCHAR NOT NULL,
  descripcion_negocio TEXT,
  zona_entrega VARCHAR,
  direccion_partida VARCHAR,
  perfil_configurado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE producto_tipo AS ENUM ('empaquetado', 'fraccionable');
CREATE TYPE producto_estado AS ENUM ('publicado', 'pausado');
CREATE TYPE producto_unidad_base AS ENUM ('gramo', 'mililitro', 'centimetro');
CREATE TYPE producto_metrica_visualizacion AS ENUM ('kilogramos', 'litros', 'metros');

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
  tipo_producto producto_tipo NOT NULL,
  estado_visibilidad producto_estado NOT NULL DEFAULT 'pausado',
  descripcion_unidad_venta VARCHAR,
  cantidad_minima_compra DECIMAL NOT NULL,
  unidad_base_interna producto_unidad_base,
  incremento_venta DECIMAL,
  metrica_visualizacion producto_metrica_visualizacion,
  stock_total INTEGER NOT NULL DEFAULT 0,
  stock_reservado INTEGER NOT NULL DEFAULT 0,
  umbral_minimo_stock INTEGER,
  habilitado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- RF-015: Registro de precio por volumen
CREATE TABLE precio_volumen (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES producto(id),
  cantidad_minima DECIMAL NOT NULL,
  precio_venta DECIMAL NOT NULL,
  precio_costo DECIMAL,
  CONSTRAINT precio_venta_positivo CHECK (precio_venta > 0),
  CONSTRAINT cantidad_minima_positiva CHECK (cantidad_minima > 0),
  CONSTRAINT precio_costo_no_negativo CHECK (precio_costo IS NULL OR precio_costo >= 0)
);

