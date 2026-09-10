import * as notificacionesServicio from '../services/notificaciones.servicio.js'
import { esIdValido } from '../middleware/validaciones.js'

async function listar(req, res, next) {
  try {
    const notificaciones = await notificacionesServicio.obtenerPorUsuario(req.usuario.id)
    res.json(notificaciones)
  } catch (error) {
    next(error)
  }
}

async function marcarLeida(req, res, next) {
  const id = Number(req.params.id)
  if (!esIdValido(id)) {
    return res.json({ ok: true })
  }
  try {
    await notificacionesServicio.marcarComoLeida(id, req.usuario.id)
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
}

export { listar, marcarLeida }
