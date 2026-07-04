const pool = require('../config/db')

class Distribuidor {
  constructor(data) {
    this.id = data.id
    this.nombreComercial = data.nombre_comercial
    this.descripcionNegocio = data.descripcion_negocio
    this.zonaEntrega = data.zona_entrega
    this.logoUrl = data.logo_url
    this.direccionPartida = data.direccion_partida
    this.perfilConfigurado = data.perfil_configurado
    this.fechaCreacion = data.fecha_creacion
  }

  static async obtenerPorId(id) {
    const resultado = await pool.query('SELECT * FROM distribuidor WHERE id = $1', [id])
    if (resultado.rows.length === 0) return null
    return new Distribuidor(resultado.rows[0])
  }

  async obtenerCalificacionPromedio() {
  return null
}

  tieneCalificaciones() {
    return this.calificacionPromedio !== null
  }
  static async configurarPerfilInicial(usuarioId, nombreComercial, descripcionNegocio, zonaEntrega) {
  const resultado = await pool.query(
    'INSERT INTO distribuidor (usuario_id, nombre_comercial, descripcion_negocio, zona_entrega, perfil_configurado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [usuarioId, nombreComercial, descripcionNegocio, zonaEntrega, true]
  )
  return new Distribuidor(resultado.rows[0])
}
}

module.exports = Distribuidor