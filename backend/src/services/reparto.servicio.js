import Distribuidor from '../models/Distribuidor.js'
import Pedido from '../models/Pedido.js'
import PlanReparto from '../models/PlanReparto.js'

async function generarPlanCarga(usuarioId, pedidoIds) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }

  if (distribuidor.latitud == null || distribuidor.longitud == null) {
    throw Object.assign(new Error('Registrá la dirección de partida del depósito antes de generar el plan.'), { status: 400 })
  }

  const disponibles = await Pedido.listarDisponiblesRepartoDistribuidor(usuarioId)
  const idsSolicitados = new Set(pedidoIds.map(Number))
  const seleccionados = disponibles.filter(p => idsSolicitados.has(p.id))

  if (seleccionados.length < 2) {
    throw Object.assign(new Error('Seleccioná al menos dos pedidos para generar la planificación.'), { status: 400 })
  }

  return PlanReparto.generarPlanCarga(distribuidor.id, distribuidor.latitud, distribuidor.longitud, seleccionados)
}

async function obtenerPlanes(usuarioId) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }

  return PlanReparto.listarPorDistribuidor(distribuidor.id)
}

async function obtenerDetalle(usuarioId, planId) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }

  const detalle = await PlanReparto.obtenerDetalle(planId, distribuidor.id)
  if (!detalle) {
    throw Object.assign(new Error('El reparto no existe.'), { status: 404 })
  }
  return detalle
}

async function editarPedidos(usuarioId, planId, pedidoIds) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }

  if (distribuidor.latitud == null || distribuidor.longitud == null) {
    throw Object.assign(new Error('Registrá la dirección de partida del depósito antes de generar el plan.'), { status: 400 })
  }

  const disponibles = await Pedido.listarDisponiblesRepartoDistribuidor(usuarioId, planId)
  const idsSolicitados = new Set(pedidoIds.map(Number))
  const seleccionados = disponibles.filter(p => idsSolicitados.has(p.id))

  const resultado = await PlanReparto.editarPedidos(planId, distribuidor.id, seleccionados, distribuidor.latitud, distribuidor.longitud, distribuidor.nombreComercial)
  if (!resultado) {
    throw Object.assign(new Error('El reparto no existe o ya está finalizado.'), { status: 404 })
  }
  return resultado
}

async function eliminarReparto(usuarioId, planId) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }

  const resultado = await PlanReparto.eliminar(planId, distribuidor.id)
  if (resultado === 'no_encontrado') {
    throw Object.assign(new Error('El reparto no existe.'), { status: 404 })
  }
  if (resultado === 'no_es_sin_empezar') {
    throw Object.assign(new Error('Este plan tiene paradas ya marcadas y no puede eliminarse.'), { status: 409 })
  }
  return { mensaje: 'El plan de reparto fue eliminado correctamente.' }
}

async function iniciarReparto(usuarioId, planId) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }

  const plan = await PlanReparto.iniciar(planId, distribuidor.id, distribuidor.nombreComercial)
  if (!plan) {
    throw Object.assign(new Error('El reparto no existe o ya no está en estado "Sin empezar".'), { status: 404 })
  }
  return plan
}

async function cerrarEnBloque(usuarioId, planId, motivo) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }

  if (!motivo || !motivo.trim()) {
    throw Object.assign(new Error('Ingresá un motivo antes de confirmar.'), { status: 400 })
  }

  const plan = await PlanReparto.cerrarEnBloque(planId, distribuidor.id, motivo.trim())
  if (!plan) {
    throw Object.assign(new Error('El reparto no existe, no está en curso o no tiene paradas pendientes.'), { status: 404 })
  }
  return plan
}

async function marcarParada(usuarioId, planId, paradaId, accion, motivo) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }

  if ((accion === 'omitido' || accion === 'rechazado') && (!motivo || !motivo.trim())) {
    throw Object.assign(new Error('Ingresá un motivo antes de confirmar.'), { status: 400 })
  }

  const resultado = await PlanReparto.marcarParada(
    planId, distribuidor.id, paradaId, accion, motivo ? motivo.trim() : null, distribuidor.nombreComercial
  )
  if (resultado === 'plan_no_valido') {
    throw Object.assign(new Error('El reparto no existe o no está en curso.'), { status: 404 })
  }
  if (resultado === 'parada_no_valida') {
    throw Object.assign(new Error('La parada no existe o ya fue marcada.'), { status: 404 })
  }
  if (resultado === 'pedido_no_valido') {
    throw Object.assign(new Error('El pedido de esta parada ya no está en camino. Actualizá la página para ver su estado actual.'), { status: 409 })
  }
  return { mensaje: 'La parada quedó marcada correctamente.' }
}

// RF-071
async function actualizarUbicacion(usuarioId, planId, latitud, longitud) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }

  const actualizado = await PlanReparto.actualizarUbicacion(planId, distribuidor.id, latitud, longitud)
  if (!actualizado) {
    throw Object.assign(new Error('El reparto no existe o no está en curso.'), { status: 404 })
  }
  return { ok: true }
}

export { generarPlanCarga, obtenerPlanes, obtenerDetalle, editarPedidos, eliminarReparto, iniciarReparto, cerrarEnBloque, marcarParada, actualizarUbicacion }
