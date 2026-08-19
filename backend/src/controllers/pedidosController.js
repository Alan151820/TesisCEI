const pedidosServicio = require('../services/pedidos.servicio')

async function confirmarPedido(req, res, next) {
  const { direccionEntrega, latitud, longitud, items } = req.body
  const compradorId = req.usuario.id

  if (!direccionEntrega || !direccionEntrega.trim()) {
    return res.status(400).json({ error: 'Debés ingresar una dirección de entrega para continuar.' })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El carrito debe contener al menos un producto.' })
  }

  try {
    const pedidos = await pedidosServicio.confirmarPedido(compradorId, direccionEntrega.trim(), latitud, longitud, items)
    res.status(201).json({ pedidos })
  } catch (error) {
    next(error)
  }
}

async function historialDistribuidor(req, res, next) {
  const distribuidorId = req.usuario.id
  try {
    const pedidos = await pedidosServicio.obtenerHistorialDistribuidor(distribuidorId)
    res.json(pedidos)
  } catch (error) {
    next(error)
  }
}

async function historialComprador(req, res, next) {
  const compradorId = req.usuario.id
  try {
    const pedidos = await pedidosServicio.obtenerHistorialComprador(compradorId)
    res.json(pedidos)
  } catch (error) {
    next(error)
  }
}

async function pedidosActivos(req, res, next) {
  try {
    const pedidos = await pedidosServicio.obtenerPedidosActivos(req.usuario.id)
    res.json(pedidos)
  } catch (error) {
    next(error)
  }
}

async function detalleComprador(req, res, next) {
  const pedidoId = Number(req.params.id)
  try {
    const pedido = await pedidosServicio.obtenerDetalleComprador(pedidoId, req.usuario.id)
    res.json(pedido)
  } catch (error) {
    next(error)
  }
}

async function detalleDistribuidor(req, res, next) {
  const pedidoId = Number(req.params.id)
  try {
    const pedido = await pedidosServicio.obtenerDetalleDistribuidor(pedidoId, req.usuario.id)
    res.json(pedido)
  } catch (error) {
    next(error)
  }
}

async function aceptarPedido(req, res, next) {
  const pedidoId = Number(req.params.id)
  try {
    const resultado = await pedidosServicio.aceptarPedido(pedidoId, req.usuario.id)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

async function rechazarPedido(req, res, next) {
  const pedidoId = Number(req.params.id)
  const { motivo } = req.body

  if (!motivo || !motivo.trim()) {
    return res.status(400).json({ error: 'Ingresá un motivo de rechazo antes de confirmar.' })
  }

  try {
    const resultado = await pedidosServicio.rechazarPedido(pedidoId, req.usuario.id, motivo.trim())
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

async function avanzarEstado(req, res, next) {
  const pedidoId = Number(req.params.id)
  try {
    const resultado = await pedidosServicio.avanzarEstado(pedidoId, req.usuario.id)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

module.exports = { confirmarPedido, historialDistribuidor, historialComprador, pedidosActivos, detalleComprador, detalleDistribuidor, aceptarPedido, rechazarPedido, avanzarEstado }
