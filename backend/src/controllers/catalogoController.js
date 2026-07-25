const catalogoServicio = require('../services/catalogo.servicio')

async function listarCatalogo(req, res, next) {
  try {
    const { nombre, categoria, distribuidor, precioMinimo, precioMaximo } = req.query
    const productos = await catalogoServicio.listarCatalogo(
      nombre || '',
      categoria || '',
      distribuidor || '',
      precioMinimo || null,
      precioMaximo || null
    )
    res.status(200).json(productos)
  } catch (error) {
    next(error)
  }
}

module.exports = { listarCatalogo }
