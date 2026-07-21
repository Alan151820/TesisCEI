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

function convertirAUnidadVisualizacion(cantidad, unidadBase) {
  if (unidadBase === 'gramo' || unidadBase === 'mililitro') return Math.round(cantidad / 1000 * 1000) / 1000
  if (unidadBase === 'centimetro') return Math.round(cantidad / 100 * 1000) / 1000
  return cantidad
}

async function listarProductos(usuarioId, filtros = {}) {
  const { categoria, visibilidad, stock } = filtros

  let condiciones = ['d.usuario_id = $1', 'p.habilitado = true']
  let params = [usuarioId]
  let contador = 2

  if (categoria) {
    condiciones.push(`c.nombre = $${contador}`)
    params.push(categoria)
    contador++
  }

  if (visibilidad) {
    condiciones.push(`p.estado_visibilidad = $${contador}`)
    params.push(visibilidad)
    contador++
  }

  if (stock === 'con_stock') {
    condiciones.push(`(p.stock_total - p.stock_reservado) > 0`)
  } else if (stock === 'sin_stock') {
    condiciones.push(`(p.stock_total - p.stock_reservado) = 0`)
  }

  const where = condiciones.join(' AND ')

  const resultado = await pool.query(
    `SELECT
       p.id,
       p.nombre,
       p.imagen_url AS "imagenUrl",
       c.nombre AS categoria,
       p.tipo_producto AS "tipoProducto",
       p.stock_total AS "stockTotal",
       p.stock_reservado AS "stockReservado",
       p.unidad_base_interna AS "unidadBaseInterna",
       p.metrica_visualizacion AS "metricaVisualizacion",
       p.estado_visibilidad AS "estadoVisibilidad"
     FROM producto p
     JOIN categoria c ON c.id = p.categoria_id
     JOIN distribuidor d ON d.id = p.distribuidor_id
     WHERE ${where}
     ORDER BY p.fecha_creacion DESC`,
    params
  )

  return resultado.rows.map(p => {
    const disponibleCrudo = p.stockTotal - p.stockReservado
    const esFraccionable = p.tipoProducto === 'fraccionable'
    return {
      id: p.id,
      nombre: p.nombre,
      imagenUrl: p.imagenUrl,
      categoria: p.categoria,
      tipoProducto: p.tipoProducto,
      metricaVisualizacion: p.metricaVisualizacion,
      stockDisponible: esFraccionable ? convertirAUnidadVisualizacion(disponibleCrudo, p.unidadBaseInterna) : disponibleCrudo,
      stockReservado: esFraccionable ? convertirAUnidadVisualizacion(p.stockReservado, p.unidadBaseInterna) : p.stockReservado,
      estadoVisibilidad: p.estadoVisibilidad,
    }
  })
}

async function cambiarVisibilidad(productoId, usuarioId, nuevoEstado) {
  const estadosValidos = ['publicado', 'pausado']
  if (!estadosValidos.includes(nuevoEstado)) {
    const error = new Error()
    error.status = 400
    error.mensaje = 'Estado de visibilidad inválido.'
    throw error
  }

  // Verificar que el producto pertenece al distribuidor
  const pertenece = await pool.query(
    `SELECT p.id FROM producto p
     JOIN distribuidor d ON d.id = p.distribuidor_id
     WHERE p.id = $1 AND d.usuario_id = $2 AND p.habilitado = true`,
    [productoId, usuarioId]
  )
  if (pertenece.rows.length === 0) {
    const error = new Error()
    error.status = 404
    error.mensaje = 'Producto no encontrado.'
    throw error
  }

  // Regla de negocio: para publicar debe tener al menos un precio por volumen
  if (nuevoEstado === 'publicado') {
    const precios = await pool.query(
      'SELECT id FROM precio_volumen WHERE producto_id = $1 LIMIT 1',
      [productoId]
    )
    if (precios.rows.length === 0) {
      const error = new Error()
      error.status = 422
      error.mensaje = 'El producto necesita al menos un precio por volumen para poder ser publicado.'
      throw error
    }
  }

  const resultado = await pool.query(
    `UPDATE producto SET estado_visibilidad = $1
     WHERE id = $2
     RETURNING id, nombre, estado_visibilidad AS "estadoVisibilidad"`,
    [nuevoEstado, productoId]
  )
  return resultado.rows[0]
}

async function obtenerProducto(productoId, usuarioId) {
  const resultado = await pool.query(
    `SELECT
       p.id, p.nombre, p.descripcion,
       p.imagen_url AS "imagenUrl",
       p.categoria_id AS "categoriaId",
       p.tipo_producto AS "tipoProducto",
       p.estado_visibilidad AS "estadoVisibilidad",
       p.descripcion_unidad_venta AS "descripcionUnidadVenta",
       p.cantidad_minima_compra AS "cantidadMinimaCompra",
       p.unidad_base_interna AS "unidadBaseInterna",
       p.incremento_venta AS "incrementoVenta",
       p.metrica_visualizacion AS "metricaVisualizacion",
       p.stock_total AS "stockTotal",
       p.stock_reservado AS "stockReservado",
       p.umbral_minimo_stock AS "umbralMinimoStock"
     FROM producto p
     JOIN distribuidor d ON d.id = p.distribuidor_id
     WHERE p.id = $1 AND d.usuario_id = $2 AND p.habilitado = true`,
    [productoId, usuarioId]
  )
  if (resultado.rows.length === 0) {
    const error = new Error()
    error.status = 404
    error.mensaje = 'Producto no encontrado.'
    throw error
  }
  return resultado.rows[0]
}

async function editarProducto(productoId, usuarioId, datos) {
  const { nombre, descripcion, imagenUrl, categoriaId, cantidadMinimaCompra, descripcionUnidadVenta, incrementoVenta, metricaVisualizacion, stockTotal, tipoProducto } = datos

  if (!nombre || nombre.trim() === '') {
    const error = new Error()
    error.status = 400
    error.mensaje = 'El nombre del producto es obligatorio.'
    throw error
  }

  const perteneceRes = await pool.query(
    `SELECT p.id, p.tipo_producto, p.stock_reservado
     FROM producto p JOIN distribuidor d ON d.id = p.distribuidor_id
     WHERE p.id = $1 AND d.usuario_id = $2 AND p.habilitado = true`,
    [productoId, usuarioId]
  )
  if (perteneceRes.rows.length === 0) {
    const error = new Error()
    error.status = 404
    error.mensaje = 'Producto no encontrado.'
    throw error
  }

  const actual = perteneceRes.rows[0]

  if (stockTotal !== undefined && stockTotal < actual.stock_reservado) {
    const error = new Error()
    error.status = 422
    error.mensaje = 'No es posible reducir el stock por debajo de las unidades reservadas en pedidos activos.'
    throw error
  }

  const tipoFinal = tipoProducto || actual.tipo_producto

  const resultado = await pool.query(
    `UPDATE producto SET
       nombre = $1, descripcion = $2,
       imagen_url = COALESCE($3, imagen_url),
       categoria_id = $4, cantidad_minima_compra = $5,
       descripcion_unidad_venta = $6, incremento_venta = $7,
       metrica_visualizacion = $8, stock_total = $9, tipo_producto = $10
     WHERE id = $11
     RETURNING id, nombre, tipo_producto AS "tipoProducto",
       estado_visibilidad AS "estadoVisibilidad",
       stock_total AS "stockTotal", stock_reservado AS "stockReservado"`,
    [
      nombre.trim(), descripcion || null, imagenUrl || null, categoriaId, cantidadMinimaCompra,
      tipoFinal === 'empaquetado' ? (descripcionUnidadVenta || null) : null,
      tipoFinal === 'fraccionable' ? (incrementoVenta || null) : null,
      tipoFinal === 'fraccionable' ? (metricaVisualizacion || null) : null,
      stockTotal !== undefined ? stockTotal : null,
      tipoFinal, productoId,
    ]
  )
  return resultado.rows[0]
}

async function eliminarOdeshabilitar(productoId, usuarioId) {
  const perteneceRes = await pool.query(
    `SELECT p.id FROM producto p JOIN distribuidor d ON d.id = p.distribuidor_id
     WHERE p.id = $1 AND d.usuario_id = $2 AND p.habilitado = true`,
    [productoId, usuarioId]
  )
  if (perteneceRes.rows.length === 0) {
    const error = new Error()
    error.status = 404
    error.mensaje = 'Producto no encontrado.'
    throw error
  }
  await pool.query('DELETE FROM precio_volumen WHERE producto_id = $1', [productoId])
  await pool.query('DELETE FROM producto WHERE id = $1', [productoId])
  return { tipoResultado: 'ELIMINADO_FISICAMENTE', mensaje: 'El producto fue eliminado correctamente.' }
}

async function configurarUmbralMinimo(productoId, usuarioId, valor) {
  if (valor < 0) {
    const error = new Error()
    error.status = 400
    error.mensaje = 'El umbral mínimo no puede ser negativo.'
    throw error
  }

  const perteneceRes = await pool.query(
    `SELECT p.id FROM producto p
     JOIN distribuidor d ON d.id = p.distribuidor_id
     WHERE p.id = $1 AND d.usuario_id = $2 AND p.habilitado = true`,
    [productoId, usuarioId]
  )
  if (perteneceRes.rows.length === 0) {
    const error = new Error()
    error.status = 404
    error.mensaje = 'Producto no encontrado.'
    throw error
  }

  const resultado = await pool.query(
    `UPDATE producto SET umbral_minimo_stock = $1
     WHERE id = $2
     RETURNING id, umbral_minimo_stock AS "umbralMinimoStock"`,
    [valor, productoId]
  )
  return resultado.rows[0]
}

module.exports = { obtenerCategorias, validarDatosCreacion, crearProducto, listarProductos, cambiarVisibilidad, obtenerProducto, editarProducto, eliminarOdeshabilitar, configurarUmbralMinimo }
