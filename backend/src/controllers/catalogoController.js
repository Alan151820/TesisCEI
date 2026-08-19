import * as catalogoServicio from '../services/catalogo.servicio.js'

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
async function obtenerDetalle(req, res, next) {
  try {
    const { id } = req.params
    const producto = await catalogoServicio.obtenerDetalle(id)

    if (!producto) {
      return res.status(404).json({ mensaje: 'Este producto no está disponible.' })
    }

    res.status(200).json(producto)
  } catch (error) {
    next(error)
  }
}
export { listarCatalogo, obtenerDetalle }
