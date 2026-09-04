import * as pedidosServicio from '../services/pedidos.servicio.js'

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

async function pedidosDisponiblesReparto(req, res, next) {
  const planId = req.query.planId ? Number(req.query.planId) : null
  try {
    const pedidos = await pedidosServicio.obtenerPedidosDisponiblesReparto(req.usuario.id, planId)
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

// RF-025
async function proponerSustituto(req, res, next) {
  const pedidoId = Number(req.params.id)
  const pedidoItemId = Number(req.params.itemId)
  const { productoSustitutoId } = req.body

  if (!productoSustitutoId) {
    return res.status(400).json({ error: 'Seleccioná un producto sustituto antes de enviar la propuesta.' })
  }

  try {
    const propuesta = await pedidosServicio.proponerSustituto(pedidoId, req.usuario.id, pedidoItemId, Number(productoSustitutoId))
    res.status(201).json(propuesta)
  } catch (error) {
    next(error)
  }
}

// RF-026: el comprador elige la cantidad del sustituto al aceptar.
async function aceptarSustitucion(req, res, next) {
  const propuestaId = Number(req.params.propuestaId)
  const { cantidad } = req.body

  if (!cantidad || !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
    return res.status(400).json({ error: 'Ingresá la cantidad del producto sustituto antes de aceptar la propuesta.' })
  }

  try {
    const resultado = await pedidosServicio.responderSustitucion(propuestaId, req.usuario.id, 'aceptar', Number(cantidad))
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

async function rechazarSustitucion(req, res, next) {
  const propuestaId = Number(req.params.propuestaId)
  try {
    const resultado = await pedidosServicio.responderSustitucion(propuestaId, req.usuario.id, 'rechazar')
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

// RF-069
async function cancelarPedido(req, res, next) {
  const pedidoId = Number(req.params.id)
  try {
    const resultado = await pedidosServicio.cancelarPedido(pedidoId, req.usuario.id)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

export { confirmarPedido, historialDistribuidor, historialComprador, pedidosDisponiblesReparto, detalleComprador, detalleDistribuidor, aceptarPedido, rechazarPedido, avanzarEstado, cancelarPedido, proponerSustituto, aceptarSustitucion, rechazarSustitucion }
