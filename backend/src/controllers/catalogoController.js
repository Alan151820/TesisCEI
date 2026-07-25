const catalogoServicio = require('../services/catalogo.servicio')

async function listarCatalogo(req, res, next) {
  try {
    const nombre = req.query.nombre || ''
    const productos = await catalogoServicio.listarCatalogo(nombre)
    res.status(200).json(productos)
  } catch (error) {
    next(error)
  }
}

module.exports = { listarCatalogo }
