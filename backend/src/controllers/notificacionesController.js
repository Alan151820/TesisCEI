import * as notificacionesServicio from '../services/notificaciones.servicio.js'

async function listar(req, res, next) {
  try {
    const notificaciones = await notificacionesServicio.obtenerPorUsuario(req.usuario.id)
    res.json(notificaciones)
  } catch (error) {
    next(error)
  }
}

async function marcarLeida(req, res, next) {
  const { id } = req.params
  try {
    await notificacionesServicio.marcarComoLeida(Number(id), req.usuario.id)
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
}

export { listar, marcarLeida }
