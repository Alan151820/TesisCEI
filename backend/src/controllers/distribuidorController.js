const Distribuidor = require('../models/Distribuidor')
const Producto = require('../models/Producto')

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
    const { nombreComercial, descripcionNegocio, zonaEntrega } = req.body

    if (!nombreComercial) {
      return res.status(400).json({ mensaje: 'El nombre comercial es obligatorio para continuar.' })
    }

    const distribuidor = await Distribuidor.configurarPerfilInicial(req.usuario.id, nombreComercial, descripcionNegocio, zonaEntrega)

    res.json({ mensaje: 'Perfil configurado correctamente.', distribuidorId: distribuidor.id })
  } catch (error) {
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
 }
const verificarPerfil = async (req, res) => {
  try {
    const distribuidor = await Distribuidor.obtenerPorUsuarioId(req.usuario.id)
    if (!distribuidor) {
      return res.json({ perfilConfigurado: false })
    }
    res.json({ perfilConfigurado: distribuidor.perfilConfigurado, distribuidorId: distribuidor.id })
  } catch (error) {
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}
const obtenerPerfilPropio = async (req, res) => {
  try {
    const distribuidor = await Distribuidor.obtenerPorUsuarioId(req.usuario.id)
    if (!distribuidor) {
      return res.status(404).json({ mensaje: 'No tenés un perfil de distribuidor configurado.' })
    }

    res.json({
      nombreComercial: distribuidor.nombreComercial,
      descripcionNegocio: distribuidor.descripcionNegocio,
      zonaEntrega: distribuidor.zonaEntrega,
      direccionPartida: distribuidor.direccionPartida,
      logoUrl: distribuidor.logoUrl,
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}

const editarPerfil = async (req, res) => {
  try {
    const { nombreComercial, descripcionNegocio, zonaEntrega } = req.body
    const distribuidor = await Distribuidor.obtenerPorUsuarioId(req.usuario.id)
    if (!distribuidor) {
      return res.status(404).json({ mensaje: 'No tenés un perfil de distribuidor configurado.' })
    }
    await distribuidor.editarPerfil(nombreComercial, descripcionNegocio, zonaEntrega)

    res.json({ mensaje: 'Perfil actualizado correctamente.' })
  } catch (error) {
    res.status(500).json({ mensaje: error.message || 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}
const subirLogo = async (req, res) => {
  try {
    const distribuidor = await Distribuidor.obtenerPorUsuarioId(req.usuario.id)
    if (!distribuidor) {
      return res.status(404).json({ mensaje: 'No tenés un perfil de distribuidor configurado.' })
    }

    const logoUrl = `/uploads/${req.file.filename}`
    await distribuidor.actualizarLogo(logoUrl)

    res.json({ mensaje: 'Logo actualizado correctamente.', logoUrl })
  } catch (error) {
    console.log(error)
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}

// RF-046: dirección de partida del depósito, usada como referencia para la
// planificación de reparto. Es una acción propia, separada de RF-053 (editar
// perfil general).
const actualizarDireccionPartida = async (req, res) => {
  try {
    const direccionPartida = (req.body.direccionPartida || '').trim()
    if (!direccionPartida) {
      return res.status(400).json({ mensaje: 'Ingresá la dirección de partida antes de guardar.' })
    }

    const distribuidor = await Distribuidor.obtenerPorUsuarioId(req.usuario.id)
    if (!distribuidor) {
      return res.status(404).json({ mensaje: 'No tenés un perfil de distribuidor configurado.' })
    }
    await distribuidor.actualizarDireccionPartida(direccionPartida)

    res.json({ mensaje: 'Dirección de partida registrada correctamente.', direccionPartida })
  } catch (error) {
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}

const obtenerProductosPublicados = async (req, res) => {
  try {
    const { id } = req.params
    const productos = await Producto.listarPublicadosPorDistribuidor(id)
    res.json(productos)
  } catch (error) {
    console.log(error)
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
}


module.exports = { obtenerPerfil, configurarPerfil, verificarPerfil, obtenerPerfilPropio, editarPerfil, subirLogo, actualizarDireccionPartida, obtenerProductosPublicados }