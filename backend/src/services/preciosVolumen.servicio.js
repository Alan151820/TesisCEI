const pool = require('../config/db')

function validarDatos(precioVenta, precioCosto, cantidadMinima) {
  if (!precioVenta || precioVenta <= 0) {
    const e = new Error()
    e.status = 400
    e.mensaje = 'El precio de venta debe ser mayor a cero.'
    throw e
  }
  if (precioCosto !== null && precioCosto !== undefined && precioCosto < 0) {
    const e = new Error()
    e.status = 400
    e.mensaje = 'El precio de costo no puede ser negativo.'
    throw e
  }
  if (!cantidadMinima || cantidadMinima <= 0) {
    const e = new Error()
    e.status = 400
    e.mensaje = 'La cantidad mínima debe ser mayor a cero.'
    throw e
  }
}

async function verificarProductoDelDistribuidor(productoId, usuarioId) {
  const res = await pool.query(
    `SELECT p.id FROM producto p
     JOIN distribuidor d ON d.id = p.distribuidor_id
     WHERE p.id = $1 AND d.usuario_id = $2 AND p.habilitado = true`,
    [productoId, usuarioId]
  )
  if (res.rows.length === 0) {
    const e = new Error()
    e.status = 404
    e.mensaje = 'Producto no encontrado.'
    throw e
  }
}

async function listarPrecios(productoId, usuarioId) {
  await verificarProductoDelDistribuidor(productoId, usuarioId)
  const res = await pool.query(
    `SELECT id, cantidad_minima AS "cantidadMinima",
            precio_venta AS "precioVenta",
            precio_costo AS "precioCosto"
     FROM precio_volumen
     WHERE producto_id = $1
     ORDER BY cantidad_minima ASC`,
    [productoId]
  )
  return res.rows
}

async function registrarPrecio(productoId, usuarioId, datos) {
  const { cantidadMinima, precioVenta, precioCosto } = datos
  validarDatos(precioVenta, precioCosto, cantidadMinima)
  await verificarProductoDelDistribuidor(productoId, usuarioId)
  const res = await pool.query(
    `INSERT INTO precio_volumen (producto_id, cantidad_minima, precio_venta, precio_costo)
     VALUES ($1, $2, $3, $4)
     RETURNING id, cantidad_minima AS "cantidadMinima",
               precio_venta AS "precioVenta", precio_costo AS "precioCosto"`,
    [productoId, cantidadMinima, precioVenta, precioCosto ?? null]
  )
  return res.rows[0]
}

async function editarPrecio(productoId, precioId, usuarioId, datos) {
  const { cantidadMinima, precioVenta, precioCosto } = datos
  validarDatos(precioVenta, precioCosto, cantidadMinima)
  await verificarProductoDelDistribuidor(productoId, usuarioId)
  const res = await pool.query(
    `UPDATE precio_volumen SET cantidad_minima = $1, precio_venta = $2, precio_costo = $3
     WHERE id = $4 AND producto_id = $5
     RETURNING id, cantidad_minima AS "cantidadMinima",
               precio_venta AS "precioVenta", precio_costo AS "precioCosto"`,
    [cantidadMinima, precioVenta, precioCosto ?? null, precioId, productoId]
  )
  if (res.rows.length === 0) {
    const e = new Error()
    e.status = 404
    e.mensaje = 'Precio no encontrado.'
    throw e
  }
  return res.rows[0]
}

async function eliminarPrecio(productoId, precioId, usuarioId) {
  await verificarProductoDelDistribuidor(productoId, usuarioId)
  const res = await pool.query(
    'DELETE FROM precio_volumen WHERE id = $1 AND producto_id = $2 RETURNING id',
    [precioId, productoId]
  )
  if (res.rows.length === 0) {
    const e = new Error()
    e.status = 404
    e.mensaje = 'Precio no encontrado.'
    throw e
  }
}

module.exports = { listarPrecios, registrarPrecio, editarPrecio, eliminarPrecio }
