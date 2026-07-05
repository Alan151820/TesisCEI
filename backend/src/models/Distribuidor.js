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
}

module.exports = Distribuidor