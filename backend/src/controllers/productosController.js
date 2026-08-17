const productosServicio = require('../services/productos.servicio')

async function listarCategorias(req, res, next) {
  try {
    const categorias = await productosServicio.obtenerCategorias()
    res.status(200).json(categorias)
  } catch (error) {
    next(error)
  }
}

async function crearProducto(req, res, next) {
  const {
    nombre,
    marca,
    descripcion,
    categoriaId,
    magnitudValor,
    magnitudUnidad,
    stockInicial,
    precioBase,
    precioCosto,
    preciosAdicionales,
  } = req.body

  if (!categoriaId) {
    return res.status(400).json({ error: 'Debés seleccionar una categoría.' })
  }

  // Los tramos adicionales (RF-015) viajan como JSON dentro del FormData
  // (junto con la imagen), no como un array nativo.
  let tramos = []
  if (preciosAdicionales) {
    try {
      tramos = JSON.parse(preciosAdicionales)
    } catch {
      return res.status(400).json({ error: 'Los precios por volumen ingresados no son válidos.' })
    }
  }

  const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null

  try {
    const { producto, precios } = await productosServicio.crearProducto(req.usuario.id, {
      nombre,
      marca,
      descripcion,
      imagenUrl,
      categoriaId,
      magnitudValor: magnitudValor ? Number(magnitudValor) : null,
      magnitudUnidad: magnitudUnidad || null,
      stockInicial: Number(stockInicial) || 0,
      precioBase: Number(precioBase),
      precioCosto: precioCosto ? Number(precioCosto) : null,
      preciosAdicionales: tramos,
    })
    res.status(201).json({ mensaje: 'Producto creado correctamente.', producto, precios })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.mensaje })
    }
    next(error)
  }
}

async function listarProductos(req, res, next) {
  try {
    const filtros = {
      categoria: req.query.categoria || null,
      visibilidad: req.query.visibilidad || null,
      stock: req.query.stock || null
    }
    const productos = await productosServicio.listarProductos(req.usuario.id, filtros)
    res.status(200).json(productos)
  } catch (error) {
    next(error)
  }
}

async function cambiarVisibilidad(req, res, next) {
  const productoId = Number(req.params.id)
  const { nuevoEstado } = req.body
  try {
    const producto = await productosServicio.cambiarVisibilidad(productoId, req.usuario.id, nuevoEstado)
    res.status(200).json({ mensaje: `Producto ${nuevoEstado} correctamente.`, producto })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.mensaje })
    next(error)
  }
}

async function obtenerProducto(req, res, next) {
  const productoId = Number(req.params.id)
  try {
    const producto = await productosServicio.obtenerProducto(productoId, req.usuario.id)
    res.status(200).json(producto)
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.mensaje })
    next(error)
  }
}

async function editarProducto(req, res, next) {
  const productoId = Number(req.params.id)
  const imagenUrl = req.file ? `/uploads/${req.file.filename}` : undefined
  const datos = { ...req.body, imagenUrl }
  if (datos.stockTotal !== undefined) datos.stockTotal = Number(datos.stockTotal)
  if (datos.magnitudValor !== undefined) datos.magnitudValor = datos.magnitudValor ? Number(datos.magnitudValor) : null
  if (datos.magnitudUnidad !== undefined) datos.magnitudUnidad = datos.magnitudUnidad || null
  if (datos.precioCosto !== undefined) datos.precioCosto = datos.precioCosto === '' ? null : Number(datos.precioCosto)
  try {
    const producto = await productosServicio.editarProducto(productoId, req.usuario.id, datos)
    res.status(200).json({ mensaje: 'Producto actualizado correctamente.', producto })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.mensaje })
    next(error)
  }
}

async function eliminarProducto(req, res, next) {
  const productoId = Number(req.params.id)
  try {
    const resultado = await productosServicio.eliminarOdeshabilitar(productoId, req.usuario.id)
    res.status(200).json(resultado)
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.mensaje })
    next(error)
  }
}

async function configurarUmbral(req, res, next) {
  const productoId = Number(req.params.id)
  const valor = Number(req.body.valor)
  if (isNaN(valor)) {
    return res.status(400).json({ error: 'El umbral mínimo no puede ser negativo.' })
  }
  try {
    const producto = await productosServicio.configurarUmbralMinimo(productoId, req.usuario.id, valor)
    res.status(200).json({ mensaje: 'Umbral configurado correctamente.', producto })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.mensaje })
    next(error)
  }
}

module.exports = { listarCategorias, crearProducto, listarProductos, cambiarVisibilidad, obtenerProducto, editarProducto, eliminarProducto, configurarUmbral }
