import * as catalogoServicio from '../services/catalogo.servicio.js'
import { esIdValido } from '../middleware/validaciones.js'

async function listarCatalogo(req, res, next) {
  try {
    const { nombre, categoria, distribuidor, precioMinimo, precioMaximo } = req.query

    for (const [etiqueta, valor] of [['mínimo', precioMinimo], ['máximo', precioMaximo]]) {
      if (valor != null && valor !== '' && (!Number.isFinite(Number(valor)) || Number(valor) < 0)) {
        return res.status(400).json({ mensaje: `El precio ${etiqueta} debe ser un número mayor o igual a cero.` })
      }
    }

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
    const id = Number(req.params.id)
    if (!esIdValido(id)) {
      return res.status(404).json({ mensaje: 'Este producto no está disponible.' })
    }

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
