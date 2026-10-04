import jwt from 'jsonwebtoken'
import Usuario from '../models/usuario.js'

async function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado.' })
  }
  const token = authHeader.slice(7)
  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado.' })
  }
  try {
    // RF-047: un token emitido antes del último cierre de sesión (o de un usuario inexistente) ya no sirve.
    if (!(await Usuario.sesionVigente(payload.id, payload.iat))) {
      return res.status(401).json({ error: 'Token inválido o expirado.' })
    }
    req.usuario = payload
    next()
  } catch (error) {
    next(error)
  }
}

export { verificarToken }
