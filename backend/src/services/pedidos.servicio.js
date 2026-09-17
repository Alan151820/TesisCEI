import Pedido from '../models/Pedido.js'
import Distribuidor from '../models/Distribuidor.js'

async function confirmarPedido(compradorId, direccionEntrega, latitud, longitud, items) {
  return Pedido.confirmarDesdeCarrito(compradorId, direccionEntrega, latitud, longitud, items)
}

// RNF-005: sin perfil de distribuidor no hay panel de pedidos que consultar
// — antes devolvía [] a cualquier usuario autenticado, mismo criterio que
// ya usa reparto.servicio.js en todos sus métodos.
async function obtenerHistorialDistribuidor(usuarioId) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }
  return Pedido.listarHistorialDistribuidor(usuarioId)
}

async function obtenerHistorialComprador(compradorId) {
  return Pedido.listarHistorialComprador(compradorId)
}

// planId (RF-064): al editar un reparto existente, incluye también sus
// propios pedidos pendientes en la lista de disponibles.
async function obtenerPedidosDisponiblesReparto(usuarioId, planId) {
  return Pedido.listarDisponiblesRepartoDistribuidor(usuarioId, planId)
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

// RF-069
async function cancelarPedido(pedidoId, compradorId) {
  const pedido = await Pedido.obtenerPropioComprador(pedidoId, compradorId)
  if (!pedido) {
    throw Object.assign(new Error('Pedido no encontrado.'), { status: 404 })
  }
  return pedido.cancelar()
}

export { confirmarPedido, obtenerHistorialDistribuidor, obtenerHistorialComprador, obtenerPedidosDisponiblesReparto, obtenerDetalleComprador, obtenerDetalleDistribuidor, aceptarPedido, rechazarPedido, avanzarEstado, cancelarPedido }
