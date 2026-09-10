import * as repartoServicio from '../services/reparto.servicio.js'
import { esIdValido } from '../middleware/validaciones.js'

async function generarPlan(req, res, next) {
  const { pedidoIds } = req.body

  if (!Array.isArray(pedidoIds) || pedidoIds.length < 2) {
    return res.status(400).json({ error: 'Seleccioná al menos dos pedidos para generar la planificación.' })
  }

  try {
    const resultado = await repartoServicio.generarPlanCarga(req.usuario.id, pedidoIds)
    res.status(201).json(resultado)
  } catch (error) {
    next(error)
  }
}

async function listarPlanes(req, res, next) {
  try {
    const planes = await repartoServicio.obtenerPlanes(req.usuario.id)
    res.json(planes)
  } catch (error) {
    next(error)
  }
}

async function obtenerDetalle(req, res, next) {
  const planId = Number(req.params.id)
  if (!esIdValido(planId)) {
    return res.status(404).json({ error: 'El reparto no existe.' })
  }
  try {
    const detalle = await repartoServicio.obtenerDetalle(req.usuario.id, planId)
    res.json(detalle)
  } catch (error) {
    next(error)
  }
}

async function editarPedidos(req, res, next) {
  const planId = Number(req.params.id)
  const { pedidoIds } = req.body

  if (!esIdValido(planId)) {
    return res.status(404).json({ error: 'El reparto no existe o ya está finalizado.' })
  }

  if (!Array.isArray(pedidoIds)) {
    return res.status(400).json({ error: 'Formato de pedidos inválido.' })
  }

  if (pedidoIds.length < 2) {
    return res.status(400).json({ error: 'Seleccioná al menos dos pedidos para el plan de reparto.' })
  }

  try {
    const resultado = await repartoServicio.editarPedidos(req.usuario.id, planId, pedidoIds)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

async function eliminar(req, res, next) {
  const planId = Number(req.params.id)
  if (!esIdValido(planId)) {
    return res.status(404).json({ error: 'El reparto no existe.' })
  }
  try {
    const resultado = await repartoServicio.eliminarReparto(req.usuario.id, planId)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

async function iniciar(req, res, next) {
  const planId = Number(req.params.id)
  if (!esIdValido(planId)) {
    return res.status(404).json({ error: 'El reparto no existe o ya no está en estado "Sin empezar".' })
  }
  try {
    const plan = await repartoServicio.iniciarReparto(req.usuario.id, planId)
    res.json(plan)
  } catch (error) {
    next(error)
  }
}

async function cerrarEnBloque(req, res, next) {
  const planId = Number(req.params.id)
  const { motivo } = req.body
  if (!esIdValido(planId)) {
    return res.status(404).json({ error: 'El reparto no existe, no está en curso o no tiene paradas pendientes.' })
  }
  try {
    const plan = await repartoServicio.cerrarEnBloque(req.usuario.id, planId, motivo)
    res.json(plan)
  } catch (error) {
    next(error)
  }
}

async function marcarParada(req, res, next) {
  const planId = Number(req.params.id)
  const paradaId = Number(req.params.paradaId)
  const { accion, motivo } = req.body

  if (!esIdValido(planId)) {
    return res.status(404).json({ error: 'El reparto no existe o no está en curso.' })
  }
  if (!esIdValido(paradaId)) {
    return res.status(404).json({ error: 'La parada no existe o ya fue marcada.' })
  }

  if (!['entregado', 'omitido', 'rechazado'].includes(accion)) {
    return res.status(400).json({ error: 'Acción inválida.' })
  }

  try {
    const resultado = await repartoServicio.marcarParada(req.usuario.id, planId, paradaId, accion, motivo)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

async function actualizarUbicacion(req, res, next) {
  const planId = Number(req.params.id)
  const { latitud, longitud } = req.body

  if (!esIdValido(planId)) {
    return res.status(404).json({ error: 'El reparto no existe o no está en curso.' })
  }

  if (typeof latitud !== 'number' || typeof longitud !== 'number') {
    return res.status(400).json({ error: 'Ubicación inválida.' })
  }

  try {
    const resultado = await repartoServicio.actualizarUbicacion(req.usuario.id, planId, latitud, longitud)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

export { generarPlan, listarPlanes, obtenerDetalle, editarPedidos, eliminar, iniciar, cerrarEnBloque, marcarParada, actualizarUbicacion }
