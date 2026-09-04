import * as preciosVolumenServicio from '../services/preciosVolumen.servicio.js'

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

async function editarPrecio(req, res, next) {
  const { cantidadMinima, precioVenta, precioCosto } = req.body
  try {
    const precio = await preciosVolumenServicio.editarPrecio(
      Number(req.params.productoId),
      Number(req.params.precioId),
      req.usuario.id,
      {
        cantidadMinima: Number(cantidadMinima),
        precioVenta: Number(precioVenta),
        precioCosto: precioCosto !== undefined && precioCosto !== '' ? Number(precioCosto) : null,
      }
    )
    res.status(200).json({ mensaje: 'Precio actualizado correctamente.', precio })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.mensaje })
    next(error)
  }
}

async function eliminarPrecio(req, res, next) {
  try {
    const resultado = await preciosVolumenServicio.eliminarPrecio(
      Number(req.params.productoId),
      Number(req.params.precioId),
      req.usuario.id
    )
    res.status(200).json(resultado)
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.mensaje })
    next(error)
  }
}

async function aplicarDescuentoTotal(req, res, next) {
  const { porcentaje } = req.body
  try {
    const precios = await preciosVolumenServicio.aplicarDescuentoTotal(
      Number(req.params.productoId),
      req.usuario.id,
      porcentaje !== undefined && porcentaje !== '' ? Number(porcentaje) : 0
    )
    res.status(200).json({ mensaje: 'Descuento aplicado correctamente.', precios })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.mensaje })
    next(error)
  }
}

export { listarPrecios, registrarPrecio, editarPrecio, eliminarPrecio, aplicarDescuentoTotal }
