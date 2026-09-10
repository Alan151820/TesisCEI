import pool from '../config/db.js'
import Notificacion from '../models/Notificacion.js'

function extraerMotivoRechazo(mensaje) {
  const match = mensaje.match(/fue rechazado\. Motivo: (.+)$/)
  return match ? match[1] : null
}

async function obtenerPorUsuario(usuarioId) {
  const res = await pool.query(
    `SELECT
       n.id, n.pedido_id AS "pedidoId", n.tipo, n.mensaje, n.leida,
       n.fecha_creacion AS "fechaCreacion",
       primer_item."imagenUrl",
       primer_item."nombreProducto",
       primer_item.cantidad,
       totales.total,
       totales."cantidadItems"
     FROM notificacion n
     LEFT JOIN pedido p ON p.id = n.pedido_id
     LEFT JOIN LATERAL (
       SELECT pr.imagen_url AS "imagenUrl", pr.nombre AS "nombreProducto", pi.cantidad
       FROM pedido_item pi
       JOIN producto pr ON pr.id = pi.producto_id
       WHERE pi.pedido_id = p.id
       ORDER BY pi.id
       LIMIT 1
     ) primer_item ON true
     LEFT JOIN LATERAL (
       SELECT COALESCE(SUM(pi.cantidad * pi.precio_venta_congelado), 0) AS total,
              COUNT(*) AS "cantidadItems"
       FROM pedido_item pi
       WHERE pi.pedido_id = p.id
     ) totales ON true
     WHERE n.usuario_id = $1
     ORDER BY n.fecha_creacion DESC`,
    [usuarioId]
  )
  return res.rows.map(n => ({ ...n, motivoRechazo: extraerMotivoRechazo(n.mensaje) }))
}

async function marcarComoLeida(id, usuarioId) {
  await Notificacion.marcarComoLeidaPorUsuario(id, usuarioId)
}

export { obtenerPorUsuario, marcarComoLeida }
