import * as catalogoServicio from '../services/catalogo.servicio.js'

async function listarCatalogo(req, res, next) {
  try {
    const { nombre, categoria, distribuidor, precioMinimo, precioMaximo } = req.query

    // RF-003 (CU-03 paso 2): los filtros de precio se validan antes de armar
    // la consulta. Sin esto, un valor no numérico llega al cast SQL de la
    // clausula HAVING y revienta con un 500 en vez de un error controlado.
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
    // RF-005: un id no entero se trata igual que un producto inexistente
    // ("Este producto no está disponible."). Sin esta guarda, un id no
    // numérico llega al WHERE p.id = $1 (columna integer) y devuelve 500.
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
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
