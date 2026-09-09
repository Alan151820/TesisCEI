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
  const id = Number(req.params.id)
  // Un id no entero (`/api/notificaciones/abc/leer`) se convertía en NaN y
  // rompía el `WHERE id = $1` (columna integer) con un 500. El endpoint es
  // idempotente y no tiene 404: un id entero inexistente ya devuelve
  // `{ ok: true }` sin marcar nada, así que un id inválido hace lo mismo.
  if (!Number.isInteger(id) || id < 1) {
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
