const productosServicio = require('../servicios/productos.servicio')

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
    descripcion,
    categoriaId,
    tipo,
    stockInicial,
    cantidadMinimaCompra,
    descripcionUnidadVenta,
    unidadBaseInterna,
    incrementoVenta,
    metricaVisualizacion,
  } = req.body

  if (!categoriaId) {
    return res.status(400).json({ error: 'Debés seleccionar una categoría.' })
  }

  const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null

  try {
    const producto = await productosServicio.crearProducto(req.usuario.id, {
      nombre,
      descripcion,
      imagenUrl,
      categoriaId,
      tipo,
      stockInicial: Number(stockInicial) || 0,
      cantidadMinimaCompra: Number(cantidadMinimaCompra),
      descripcionUnidadVenta,
      unidadBaseInterna,
      incrementoVenta: incrementoVenta ? Number(incrementoVenta) : null,
      metricaVisualizacion,
    })
    res.status(201).json({ mensaje: 'Producto creado correctamente.', producto })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.mensaje })
    }
    next(error)
  }
}

async function listarProductos(req, res, next) {
  try {
    const productos = await productosServicio.listarProductos(req.usuario.id)
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
  const {
    nombre,
    descripcion,
    categoriaId,
    tipoProducto,
    stockTotal,
    cantidadMinimaCompra,
    descripcionUnidadVenta,
    incrementoVenta,
    metricaVisualizacion,
  } = req.body

  const imagenUrl = req.file ? `/uploads/${req.file.filename}` : undefined

  try {
    const producto = await productosServicio.editarProducto(productoId, req.usuario.id, {
      nombre,
      descripcion,
      imagenUrl,
      categoriaId: Number(categoriaId),
      tipoProducto,
      stockTotal: stockTotal !== undefined ? Number(stockTotal) : undefined,
      cantidadMinimaCompra: Number(cantidadMinimaCompra),
      descripcionUnidadVenta,
      incrementoVenta: incrementoVenta ? Number(incrementoVenta) : null,
      metricaVisualizacion,
    })
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

module.exports = { listarCategorias, crearProducto, listarProductos, cambiarVisibilidad, obtenerProducto, editarProducto, eliminarProducto }
