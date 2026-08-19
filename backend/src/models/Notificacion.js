import pool from '../config/db.js'

class Notificacion {
  constructor(data) {
    this.id = data.id
    this.usuarioId = data.usuario_id
    this.pedidoId = data.pedido_id
    this.tipo = data.tipo
    this.mensaje = data.mensaje
    this.leida = data.leida
    this.fechaCreacion = data.fecha_creacion
  }

  static async crear(usuarioId, tipo, mensaje, pedidoId = null, cliente = pool) {
    const res = await cliente.query(
      `INSERT INTO notificacion (usuario_id, pedido_id, tipo, mensaje) VALUES ($1, $2, $3, $4) RETURNING *`,
      [usuarioId, pedidoId, tipo, mensaje]
    )
    return new Notificacion(res.rows[0])
  }

  async marcarComoLeida() {
    await pool.query('UPDATE notificacion SET leida = TRUE WHERE id = $1', [this.id])
    this.leida = true
  }

  static async marcarComoLeidaPorUsuario(id, usuarioId) {
    await pool.query(
      'UPDATE notificacion SET leida = TRUE WHERE id = $1 AND usuario_id = $2',
      [id, usuarioId]
    )
  }
}

export default Notificacion
