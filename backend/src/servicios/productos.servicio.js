const pool = require('../config/db')

async function obtenerCategorias() {
  const resultado = await pool.query('SELECT id, nombre FROM categoria ORDER BY nombre')
  return resultado.rows
}

function validarDatosCreacion(nombre, tipo, stockInicial, cantidadMinima, incrementoVenta) {
  if (!nombre || nombre.trim() === '') {
    const error = new Error()
    error.status = 400
    error.mensaje = 'El nombre del producto es obligatorio.'
    throw error
  }
  if (!tipo) {
    const error = new Error()
    error.status = 400
    error.mensaje = 'Debés seleccionar el tipo de producto.'
    throw error
  }
  if (stockInicial < 0) {
    const error = new Error()
    error.status = 400
    error.mensaje = 'El stock inicial no puede ser negativo.'
    throw error
  }
  if (!cantidadMinima || cantidadMinima <= 0) {
    const error = new Error()
    error.status = 400
    error.mensaje = 'La cantidad mínima de compra debe ser mayor a cero.'
    throw error
  }
  if (tipo === 'fraccionable' && (!incrementoVenta || incrementoVenta <= 0)) {
    const error = new Error()
    error.status = 400
    error.mensaje = 'El incremento de venta debe ser mayor a cero.'
    throw error
  }
}

async function crearProducto(usuarioId, datos) {
  const {
    nombre,
    descripcion,
    imagenUrl,
    categoriaId,
    tipo,
    stockInicial,
    cantidadMinimaCompra,
    descripcionUnidadVenta,
    unidadBaseInterna,
    incrementoVenta,
    metricaVisualizacion,
  } = datos

  validarDatosCreacion(nombre, tipo, stockInicial, cantidadMinimaCompra, incrementoVenta)

  const distribuidorRes = await pool.query(
    'SELECT id FROM distribuidor WHERE usuario_id = $1',
    [usuarioId]
  )
  if (distribuidorRes.rows.length === 0) {
    const error = new Error()
    error.status = 403
    error.mensaje = 'No tenés un perfil de distribuidor activo.'
    throw error
  }
  const distribuidorId = distribuidorRes.rows[0].id

  const resultado = await pool.query(
    `INSERT INTO producto (
      distribuidor_id, categoria_id, nombre, descripcion, imagen_url,
      tipo_producto, stock_total, cantidad_minima_compra,
      descripcion_unidad_venta, unidad_base_interna, incremento_venta, metrica_visualizacion
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, nombre, tipo_producto, estado_visibilidad, fecha_creacion`,
    [
      distribuidorId,
      categoriaId,
      nombre.trim(),
      descripcion || null,
      imagenUrl || null,
      tipo,
      stockInicial || 0,
      cantidadMinimaCompra,
      tipo === 'empaquetado' ? (descripcionUnidadVenta || null) : null,
      tipo === 'fraccionable' ? unidadBaseInterna : null,
      tipo === 'fraccionable' ? incrementoVenta : null,
      tipo === 'fraccionable' ? metricaVisualizacion : null,
    ]
  )

  return resultado.rows[0]
}

async function listarProductos(usuarioId) {
  const resultado = await pool.query(
    `SELECT
       p.id,
       p.nombre,
       p.imagen_url AS "imagenUrl",
       c.nombre AS categoria,
       (p.stock_total - p.stock_reservado) AS "stockDisponible",
       p.stock_reservado AS "stockReservado",
       p.estado_visibilidad AS "estadoVisibilidad",
       p.tipo_producto AS "tipoProducto"
     FROM producto p
     JOIN categoria c ON c.id = p.categoria_id
     JOIN distribuidor d ON d.id = p.distribuidor_id
     WHERE d.usuario_id = $1 AND p.habilitado = true
     ORDER BY p.fecha_creacion DESC`,
    [usuarioId]
  )
  return resultado.rows
}

module.exports = { obtenerCategorias, validarDatosCreacion, crearProducto, listarProductos }
