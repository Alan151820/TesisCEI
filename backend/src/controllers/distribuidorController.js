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

module.exports = { obtenerPerfil }