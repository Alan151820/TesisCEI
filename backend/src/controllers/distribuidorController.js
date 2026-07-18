const Distribuidor = require('../models/Distribuidor')

const obtenerPerfil = async (req, res) => {
  try {
    const { id } = req.params
    const distribuidor = await Distribuidor.obtenerPorId(id)

    if (!distribuidor) {
      return res.status(404).json({ mensaje: 'El perfil del distribuidor no está disponible.' })
    }

    const calificacionPromedio = await distribuidor.obtenerCalificacionPromedio()

    res.json({
      id: distribuidor.id,
      nombreComercial: distribuidor.nombreComercial,
      descripcionNegocio: distribuidor.descripcionNegocio,
      zonaEntrega: distribuidor.zonaEntrega,
      logoUrl: distribuidor.logoUrl,
      calificacionPromedio
    })
  } catch (error) {
      console.log(error)
  res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}
const configurarPerfil = async (req, res) => {
  try {
    const { telefono, nombreComercial, descripcionNegocio, zonaEntrega } = req.body

    if (!nombreComercial) {
      return res.status(400).json({ mensaje: 'El nombre comercial es obligatorio para continuar.' })
    }

    const usuarioResultado = await require('../config/db').query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
    if (usuarioResultado.rows.length === 0) {
      return res.status(400).json({ mensaje: 'No encontramos una cuenta con ese número de teléfono.' })
    }

    const usuarioId = usuarioResultado.rows[0].id
    const distribuidor = await Distribuidor.configurarPerfilInicial(usuarioId, nombreComercial, descripcionNegocio, zonaEntrega)

    res.json({ mensaje: 'Perfil configurado correctamente.', distribuidorId: distribuidor.id })
  } catch (error) {
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
 }
const verificarPerfil = async (req, res) => {
  try {
    const { telefono } = req.body
    const db = require('../config/db')
    
    const usuario = await db.query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
    if (usuario.rows.length === 0) return res.status(400).json({ mensaje: 'No encontramos una cuenta con ese número de teléfono.' })

    const distribuidor = await db.query('SELECT id, perfil_configurado FROM distribuidor WHERE usuario_id = $1', [usuario.rows[0].id])

    if (distribuidor.rows.length === 0) {
      return res.json({ perfilConfigurado: false })
    }

    res.json({ perfilConfigurado: distribuidor.rows[0].perfil_configurado, distribuidorId: distribuidor.rows[0].id })
  } catch (error) {
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}
const obtenerPerfilPropio = async (req, res) => {
  try {
    const { telefono } = req.body
    const db = require('../config/db')
    const usuario = await db.query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
    if (usuario.rows.length === 0) return res.status(400).json({ mensaje: 'No encontramos una cuenta con ese número de teléfono.' })

    const distribuidor = await Distribuidor.obtenerPorId(
      (await db.query('SELECT id FROM distribuidor WHERE usuario_id = $1', [usuario.rows[0].id])).rows[0].id
    )

    res.json({
      nombreComercial: distribuidor.nombreComercial,
      descripcionNegocio: distribuidor.descripcionNegocio,
      zonaEntrega: distribuidor.zonaEntrega
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}

const editarPerfil = async (req, res) => {
  try {
    const { telefono, nombreComercial, descripcionNegocio, zonaEntrega } = req.body
    const db = require('../config/db')
    const usuario = await db.query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
    if (usuario.rows.length === 0) return res.status(400).json({ mensaje: 'No encontramos una cuenta con ese número de teléfono.' })

    const distResult = await db.query('SELECT id FROM distribuidor WHERE usuario_id = $1', [usuario.rows[0].id])
    const distribuidor = await Distribuidor.obtenerPorId(distResult.rows[0].id)
    await distribuidor.editarPerfil(nombreComercial, descripcionNegocio, zonaEntrega)

    res.json({ mensaje: 'Perfil actualizado correctamente.' })
  } catch (error) {
    res.status(500).json({ mensaje: error.message || 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}
const subirLogo = async (req, res) => {
  try {
    const telefono = req.body.telefono
    const db = require('../config/db')

    const usuario = await db.query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
    if (usuario.rows.length === 0) return res.status(400).json({ mensaje: 'No encontramos una cuenta con ese número de teléfono.' })

    const distResult = await db.query('SELECT id FROM distribuidor WHERE usuario_id = $1', [usuario.rows[0].id])
    const distribuidor = await Distribuidor.obtenerPorId(distResult.rows[0].id)

    const logoUrl = `/uploads/${req.file.filename}`
    await distribuidor.actualizarLogo(logoUrl)

    res.json({ mensaje: 'Logo actualizado correctamente.', logoUrl })
  } catch (error) {
    console.log(error)
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}

const obtenerProductosPublicados = async (req, res) => {
  try {
    const { id } = req.params
    const db = require('../config/db')

    const productos = await db.query(
      `SELECT p.id, p.nombre, p.descripcion, p.imagen_url AS "imagenUrl", c.nombre AS categoria
       FROM producto p
       JOIN categoria c ON c.id = p.categoria_id
       WHERE p.distribuidor_id = $1 AND p.estado_visibilidad = 'publicado' AND p.habilitado = true
       ORDER BY p.fecha_creacion DESC`,
      [id]
    )

    res.json(productos.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}


module.exports = { obtenerPerfil, configurarPerfil, verificarPerfil, obtenerPerfilPropio, editarPerfil, subirLogo, obtenerProductosPublicados }