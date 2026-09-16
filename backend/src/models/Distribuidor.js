import pool from '../config/db.js'

class Distribuidor {
  constructor(data) {
    this.id = data.id
    this.nombreComercial = data.nombre_comercial
    this.descripcionNegocio = data.descripcion_negocio
    this.zonaEntrega = data.zona_entrega
    this.logoUrl = data.logo_url
    this.direccionPartida = data.direccion_partida
    this.latitud = data.latitud
    this.longitud = data.longitud
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

  static async configurarPerfilInicial(usuarioId, nombreComercial, descripcionNegocio, zonaEntrega, direccionPartida = null, latitud = null, longitud = null) {
  const resultado = await pool.query(
    'INSERT INTO distribuidor (usuario_id, nombre_comercial, descripcion_negocio, zona_entrega, direccion_partida, latitud, longitud, perfil_configurado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [usuarioId, nombreComercial, descripcionNegocio, zonaEntrega, direccionPartida, latitud, longitud, true]
  )
  return new Distribuidor(resultado.rows[0])
}

async editarPerfil(nombreComercial, descripcionNegocio, zonaEntrega) {
  if (!nombreComercial) throw Object.assign(new Error('El nombre comercial no puede quedar vacío.'), { status: 400 })

  await pool.query(
    'UPDATE distribuidor SET nombre_comercial = $1, descripcion_negocio = $2, zona_entrega = $3 WHERE id = $4',
    [nombreComercial, descripcionNegocio, zonaEntrega, this.id]
  )

  this.nombreComercial = nombreComercial
  this.descripcionNegocio = descripcionNegocio
  this.zonaEntrega = zonaEntrega

  return true
}
async actualizarLogo(logoUrl) {
  await pool.query('UPDATE distribuidor SET logo_url = $1 WHERE id = $2', [logoUrl, this.id])
  this.logoUrl = logoUrl
  return true
}

async actualizarDireccionPartida(direccionPartida, latitud, longitud) {
  await pool.query(
    'UPDATE distribuidor SET direccion_partida = $1, latitud = $2, longitud = $3 WHERE id = $4',
    [direccionPartida, latitud, longitud, this.id]
  )
  this.direccionPartida = direccionPartida
  this.latitud = latitud
  this.longitud = longitud
  return true
}

static async obtenerPorUsuarioId(usuarioId) {
  const resultado = await pool.query('SELECT * FROM distribuidor WHERE usuario_id = $1', [usuarioId])
  if (resultado.rows.length === 0) return null
  return new Distribuidor(resultado.rows[0])
}

static async requerirPorUsuarioId(usuarioId) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }
  return distribuidor
}
}

export default Distribuidor
