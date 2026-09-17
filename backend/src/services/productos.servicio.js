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
    throw Object.assign(new Error('No tenés un perfil de distribuidor activo.'), { status: 403 })
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
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor activo.'), { status: 403 })
  }
  return Producto.listarPorDistribuidor(usuarioId, filtros)
}

async function aplicarDescuentoTotal(usuarioId, filtros, porcentaje) {
  if (!porcentaje || porcentaje <= 0) {
    throw Object.assign(new Error('Ingresá un porcentaje de descuento mayor a cero.'), { status: 400 })
  }
  if (porcentaje >= 100) {
    throw Object.assign(new Error('El descuento total debe ser menor a 100%.'), { status: 400 })
  }

  const productosAfectados = await PrecioVolumen.aplicarDescuentoMasivo(usuarioId, filtros, porcentaje)
  return { productosAfectados }
}

async function cambiarVisibilidad(productoId, usuarioId, nuevoEstado) {
  const estadosValidos = ['publicado', 'pausado']
  if (!estadosValidos.includes(nuevoEstado)) {
    throw Object.assign(new Error('Estado de visibilidad inválido.'), { status: 400 })
  }

  const producto = await Producto.obtenerPropio(productoId, usuarioId)
  if (!producto) {
    throw Object.assign(new Error('Producto no encontrado.'), { status: 404 })
  }

  return producto.cambiarVisibilidad(nuevoEstado)
}

async function obtenerProducto(productoId, usuarioId) {
  const producto = await Producto.obtenerPropio(productoId, usuarioId)
  if (!producto) {
    throw Object.assign(new Error('Producto no encontrado.'), { status: 404 })
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
    throw Object.assign(new Error('Producto no encontrado.'), { status: 404 })
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
    throw Object.assign(new Error('Producto no encontrado.'), { status: 404 })
  }
  return producto.eliminarOdeshabilitar()
}

async function configurarUmbralMinimo(productoId, usuarioId, valor) {
  if (valor < 0) {
    throw Object.assign(new Error('El umbral mínimo no puede ser negativo.'), { status: 400 })
  }

  const producto = await Producto.obtenerPropio(productoId, usuarioId)
  if (!producto) {
    throw Object.assign(new Error('Producto no encontrado.'), { status: 404 })
  }

  return producto.configurarUmbralMinimo(valor)
}

export { obtenerCategorias, validarDatosCreacion, crearProducto, listarProductos, aplicarDescuentoTotal, cambiarVisibilidad, obtenerProducto, editarProducto, eliminarOdeshabilitar, configurarUmbralMinimo, notificarSiCruzaUmbral }
