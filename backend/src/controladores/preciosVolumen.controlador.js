const preciosVolumenServicio = require('../servicios/preciosVolumen.servicio')

async function listarPrecios(req, res, next) {
  try {
    const precios = await preciosVolumenServicio.listarPrecios(
      Number(req.params.productoId),
      req.usuario.id
    )
    res.status(200).json(precios)
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.mensaje })
    next(error)
  }
}

async function registrarPrecio(req, res, next) {
  const { cantidadMinima, precioVenta, precioCosto } = req.body
  try {
    const precio = await preciosVolumenServicio.registrarPrecio(
      Number(req.params.productoId),
      req.usuario.id,
      {
        cantidadMinima: Number(cantidadMinima),
        precioVenta: Number(precioVenta),
        precioCosto: precioCosto !== undefined && precioCosto !== '' ? Number(precioCosto) : null,
      }
    )
    res.status(201).json({ mensaje: 'Precio registrado correctamente.', precio })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.mensaje })
    next(error)
  }
}

module.exports = { listarPrecios, registrarPrecio }
