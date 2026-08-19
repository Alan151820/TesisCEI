import pool from '../config/db.js'

class CodigoVerificacion {
  constructor(data) {
    this.id = data.id
    this.usuarioId = data.usuario_id
    this.codigo = data.codigo
    this.proposito = data.proposito
    this.fechaExpiracion = data.fecha_expiracion
    this.usado = data.usado
    this.fechaCreacion = data.fecha_creacion
  }

  static generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  static calcularExpiracion() {
    return new Date(Date.now() + 10 * 60 * 1000)
  }

  static async crear(usuarioId, codigo, proposito, fechaExpiracion, usado = false) {
    const resultado = await pool.query(
      'INSERT INTO codigo_verificacion (usuario_id, codigo, proposito, fecha_expiracion, usado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [usuarioId, codigo, proposito, fechaExpiracion, usado]
    )
    return new CodigoVerificacion(resultado.rows[0])
  }

  static async buscarVigente(usuarioId, codigo, proposito) {
    const resultado = await pool.query(
      'SELECT * FROM codigo_verificacion WHERE usuario_id = $1 AND codigo = $2 AND proposito = $3 AND usado = FALSE',
      [usuarioId, codigo, proposito]
    )
    if (resultado.rows.length === 0) return null
    return new CodigoVerificacion(resultado.rows[0])
  }

  haVencido() {
    return new Date() > new Date(this.fechaExpiracion)
  }

  async marcarComoUsado() {
    await pool.query('UPDATE codigo_verificacion SET usado = TRUE WHERE id = $1', [this.id])
    this.usado = true
  }
}

export default CodigoVerificacion
