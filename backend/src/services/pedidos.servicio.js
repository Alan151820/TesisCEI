import Pedido from '../models/Pedido.js'

async function confirmarPedido(compradorId, direccionEntrega, latitud, longitud, items) {
  return Pedido.confirmarDesdeCarrito(compradorId, direccionEntrega, latitud, longitud, items)
}

async function obtenerHistorialDistribuidor(usuarioId) {
  return Pedido.listarHistorialDistribuidor(usuarioId)
}

async function obtenerHistorialComprador(compradorId) {
  return Pedido.listarHistorialComprador(compradorId)
}

async function obtenerPedidosActivos(usuarioId) {
  return Pedido.listarActivosDistribuidor(usuarioId)
}

async function obtenerDetalleComprador(pedidoId, compradorId) {
  const detalle = await Pedido.obtenerDetalleComprador(pedidoId, compradorId)
  if (!detalle) {
    throw Object.assign(new Error('Pedido no encontrado.'), { status: 404 })
  }
  return detalle
}

async function obtenerDetalleDistribuidor(pedidoId, distribuidorUsuarioId) {
  const detalle = await Pedido.obtenerDetalleDistribuidor(pedidoId, distribuidorUsuarioId)
  if (!detalle) {
    throw Object.assign(new Error('Pedido no encontrado.'), { status: 404 })
  }
  return detalle
}

async function obtenerPedidoPropio(pedidoId, distribuidorUsuarioId) {
  const pedido = await Pedido.obtenerPropioDistribuidor(pedidoId, distribuidorUsuarioId)
  if (!pedido) {
    throw Object.assign(new Error('Pedido no encontrado.'), { status: 404 })
  }
  return pedido
}

async function aceptarPedido(pedidoId, distribuidorUsuarioId) {
  const pedido = await obtenerPedidoPropio(pedidoId, distribuidorUsuarioId)
  return pedido.aceptar(distribuidorUsuarioId)
}

async function rechazarPedido(pedidoId, distribuidorUsuarioId, motivo) {
  const pedido = await obtenerPedidoPropio(pedidoId, distribuidorUsuarioId)
  return pedido.rechazar(motivo)
}

async function avanzarEstado(pedidoId, distribuidorUsuarioId) {
  const pedido = await obtenerPedidoPropio(pedidoId, distribuidorUsuarioId)
  return pedido.avanzarEstado()
}

export { confirmarPedido, obtenerHistorialDistribuidor, obtenerHistorialComprador, obtenerPedidosActivos, obtenerDetalleComprador, obtenerDetalleDistribuidor, aceptarPedido, rechazarPedido, avanzarEstado }
