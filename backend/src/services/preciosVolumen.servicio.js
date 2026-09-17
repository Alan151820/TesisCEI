import PrecioVolumen from '../models/PrecioVolumen.js'
import Producto from '../models/Producto.js'

const validarDatos = PrecioVolumen.validarDatos

async function verificarProductoDelDistribuidor(productoId, usuarioId) {
  const producto = await Producto.obtenerPropio(productoId, usuarioId)
  if (!producto) {
    throw Object.assign(new Error('Producto no encontrado.'), { status: 404 })
  }
}

async function listarPrecios(productoId, usuarioId) {
  await verificarProductoDelDistribuidor(productoId, usuarioId)
  return PrecioVolumen.listarPorProducto(productoId)
}

async function registrarPrecio(productoId, usuarioId, datos) {
  const { cantidadMinima, precioVenta, precioCosto } = datos
  PrecioVolumen.validarDatos(precioVenta, precioCosto, cantidadMinima)
  await verificarProductoDelDistribuidor(productoId, usuarioId)
  return PrecioVolumen.crear(productoId, cantidadMinima, precioVenta, precioCosto)
}

async function editarPrecio(productoId, precioId, usuarioId, datos) {
  const { cantidadMinima, precioVenta, precioCosto } = datos
  PrecioVolumen.validarDatos(precioVenta, precioCosto, cantidadMinima)
  await verificarProductoDelDistribuidor(productoId, usuarioId)

  const precio = await PrecioVolumen.obtenerPorId(precioId, productoId)
  if (!precio) {
    throw Object.assign(new Error('Precio no encontrado.'), { status: 404 })
  }
  await precio.editar(cantidadMinima, precioVenta, precioCosto)
  return precio
}

async function eliminarPrecio(productoId, precioId, usuarioId) {
  await verificarProductoDelDistribuidor(productoId, usuarioId)

  const precio = await PrecioVolumen.obtenerPorId(precioId, productoId)
  if (!precio) {
    throw Object.assign(new Error('Precio no encontrado.'), { status: 404 })
  }

  return precio.eliminar()
}

async function aplicarDescuentoTotal(productoId, usuarioId, porcentaje) {
  await verificarProductoDelDistribuidor(productoId, usuarioId)

  if (!porcentaje || porcentaje <= 0) {
    return PrecioVolumen.listarPorProducto(productoId)
  }
  if (porcentaje >= 100) {
    const e = new Error()
    e.status = 400
    e.mensaje = 'El descuento total debe ser menor a 100%.'
    throw e
  }

  await PrecioVolumen.aplicarDescuentoTotal(productoId, porcentaje)
  return PrecioVolumen.listarPorProducto(productoId)
}

export { validarDatos, listarPrecios, registrarPrecio, editarPrecio, eliminarPrecio, aplicarDescuentoTotal }
