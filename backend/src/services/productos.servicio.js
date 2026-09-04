import pool from '../config/db.js'
import { validarDatos as validarDatosPrecio } from './preciosVolumen.servicio.js'
import Categoria from '../models/Categoria.js'
import Producto from '../models/Producto.js'
import PrecioVolumen from '../models/PrecioVolumen.js'
import Distribuidor from '../models/Distribuidor.js'

const notificarSiCruzaUmbral = Producto.notificarSiCruzaUmbral

async function obtenerCategorias() {
  return Categoria.listarTodas()
}

function validarDatosCreacion(nombre, marca, precioBase, stockInicial) {
  Producto.validarDatosCreacion(nombre, marca, precioBase, stockInicial)
}

async function crearProducto(usuarioId, datos) {
  const { nombre, marca, precioBase, stockInicial, preciosAdicionales } = datos

  Producto.validarDatosCreacion(nombre, marca, precioBase, stockInicial)

  const tramos = preciosAdicionales || []
  for (const tramo of tramos) {
    validarDatosPrecio(Number(tramo.precioVenta), tramo.precioCosto != null ? Number(tramo.precioCosto) : null, Number(tramo.cantidadMinima))
  }

  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    const error = new Error()
    error.status = 403
    error.mensaje = 'No tenés un perfil de distribuidor activo.'
    throw error
  }

  const { producto, precios } = await Producto.crear(distribuidor.id, datos)
  return {
    producto: {
      id: producto.id,
      nombre: producto.nombre,
      estadoVisibilidad: producto.estadoVisibilidad,
      fechaCreacion: producto.fechaCreacion,
    },
    precios: precios.map(p => p.toJSON()),
  }
}

async function listarProductos(usuarioId, filtros = {}) {
  return Producto.listarPorDistribuidor(usuarioId, filtros)
}

// Descuento total del catálogo, aplicado desde el panel "Mis productos" a
// todos los productos que coincidan con los filtros vigentes en la lista
// (reemplaza al descuento por producto individual que vivía en la ficha de
// edición, confirmado con el usuario).
async function aplicarDescuentoTotal(usuarioId, filtros, porcentaje) {
  if (!porcentaje || porcentaje <= 0) {
    const e = new Error()
    e.status = 400
    e.mensaje = 'Ingresá un porcentaje de descuento mayor a cero.'
    throw e
  }
  if (porcentaje >= 100) {
    const e = new Error()
    e.status = 400
    e.mensaje = 'El descuento total debe ser menor a 100%.'
    throw e
  }

  const productosAfectados = await PrecioVolumen.aplicarDescuentoMasivo(usuarioId, filtros, porcentaje)
  return { productosAfectados }
}

async function cambiarVisibilidad(productoId, usuarioId, nuevoEstado) {
  const estadosValidos = ['publicado', 'pausado']
  if (!estadosValidos.includes(nuevoEstado)) {
    const error = new Error()
    error.status = 400
    error.mensaje = 'Estado de visibilidad inválido.'
    throw error
  }

  const producto = await Producto.obtenerPropio(productoId, usuarioId)
  if (!producto) {
    const error = new Error()
    error.status = 404
    error.mensaje = 'Producto no encontrado.'
    throw error
  }

  return producto.cambiarVisibilidad(nuevoEstado)
}

async function obtenerProducto(productoId, usuarioId) {
  const producto = await Producto.obtenerPropio(productoId, usuarioId)
  if (!producto) {
    const error = new Error()
    error.status = 404
    error.mensaje = 'Producto no encontrado.'
    throw error
  }
  return {
    id: producto.id,
    nombre: producto.nombre,
    marca: producto.marca,
    descripcion: producto.descripcion,
    imagenUrl: producto.imagenUrl,
    categoriaId: producto.categoriaId,
    estadoVisibilidad: producto.estadoVisibilidad,
    magnitudValor: producto.magnitudValor,
    magnitudUnidad: producto.magnitudUnidad,
    stockTotal: producto.stockTotal,
    stockReservado: producto.stockReservado,
    umbralMinimoStock: producto.umbralMinimoStock,
  }
}

async function editarProducto(productoId, usuarioId, datos) {
  const { nombre, marca, descripcion, imagenUrl, categoriaId, magnitudValor, magnitudUnidad, stockTotal, precioCosto } = datos

  Producto.validarEdicion(nombre, marca)

  const producto = await Producto.obtenerPropio(productoId, usuarioId)
  if (!producto) {
    const error = new Error()
    error.status = 404
    error.mensaje = 'Producto no encontrado.'
    throw error
  }

  const stockAntes = producto.stockTotal
  const reservadoAntes = producto.stockReservado
  const umbralAntes = producto.umbralMinimoStock

  await producto.editar({ nombre, marca, descripcion, imagenUrl, categoriaId, magnitudValor, magnitudUnidad, stockTotal })

  if (stockTotal !== undefined) {
    await notificarSiCruzaUmbral(pool, {
      nombre: producto.nombre,
      umbralMinimoStock: umbralAntes,
      usuarioDistribuidorId: usuarioId,
      disponibleAntes: stockAntes - reservadoAntes,
      disponibleDespues: stockTotal - reservadoAntes,
    })
  }

  if (precioCosto !== undefined) {
    await PrecioVolumen.actualizarPrecioCostoBase(productoId, precioCosto)
  }

  return {
    id: producto.id,
    nombre: producto.nombre,
    estadoVisibilidad: producto.estadoVisibilidad,
    stockTotal: producto.stockTotal,
    stockReservado: producto.stockReservado,
  }
}

async function eliminarOdeshabilitar(productoId, usuarioId) {
  const producto = await Producto.obtenerPropio(productoId, usuarioId)
  if (!producto) {
    const error = new Error()
    error.status = 404
    error.mensaje = 'Producto no encontrado.'
    throw error
  }
  return producto.eliminarOdeshabilitar()
}

async function configurarUmbralMinimo(productoId, usuarioId, valor) {
  if (valor < 0) {
    const error = new Error()
    error.status = 400
    error.mensaje = 'El umbral mínimo no puede ser negativo.'
    throw error
  }

  const producto = await Producto.obtenerPropio(productoId, usuarioId)
  if (!producto) {
    const error = new Error()
    error.status = 404
    error.mensaje = 'Producto no encontrado.'
    throw error
  }

  return producto.configurarUmbralMinimo(valor)
}

export { obtenerCategorias, validarDatosCreacion, crearProducto, listarProductos, aplicarDescuentoTotal, cambiarVisibilidad, obtenerProducto, editarProducto, eliminarOdeshabilitar, configurarUmbralMinimo, notificarSiCruzaUmbral }
