const catalogoServicio = require('../services/catalogo.servicio')

async function listarCatalogo(req, res, next) {
  try {
    const productos = await catalogoServicio.listarCatalogo()
    res.status(200).json(productos)
  } catch (error) {
    next(error)
  }
}

module.exports = { listarCatalogo }
