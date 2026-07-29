const pool = require('../config/db')

async function obtenerPorUsuario(usuarioId) {
  const res = await pool.query(
    `SELECT id, pedido_id AS "pedidoId", tipo, mensaje, leida,
            fecha_creacion AS "fechaCreacion"
     FROM notificacion
     WHERE usuario_id = $1
     ORDER BY fecha_creacion DESC`,
    [usuarioId]
  )
  return res.rows
}

async function marcarComoLeida(id, usuarioId) {
  await pool.query(
    `UPDATE notificacion SET leida = TRUE
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  )
}

module.exports = { obtenerPorUsuario, marcarComoLeida }
