import pool from '../config/db.js'
import PrecioVolumen from './PrecioVolumen.js'
import Notificacion from './Notificacion.js'

const ESTADOS_VISIBILIDAD_VALIDOS = ['publicado', 'pausado']

class Producto {
  constructor(data) {
    this.id = data.id
    this.distribuidorId = data.distribuidor_id
    this.categoriaId = data.categoria_id
    this.nombre = data.nombre
    this.marca = data.marca
    this.descripcion = data.descripcion
    this.imagenUrl = data.imagen_url
    this.magnitudValor = data.magnitud_valor
    this.magnitudUnidad = data.magnitud_unidad
    this.estadoVisibilidad = data.estado_visibilidad
    this.habilitado = data.habilitado
    this.stockTotal = data.stock_total
    this.stockReservado = data.stock_reservado
    this.umbralMinimoStock = data.umbral_minimo_stock
    this.fechaCreacion = data.fecha_creacion
  }

  get stockDisponible() {
    return this.stockTotal - this.stockReservado
  }

  obtenerStockDisponible() {
    return this.stockDisponible
  }

  static validarDatosCreacion(nombre, marca, precioBase, stockInicial) {
    if (!nombre || nombre.trim() === '') {
      const error = new Error()
      error.status = 400
      error.mensaje = 'El nombre del producto es obligatorio.'
      throw error
    }
    if (!marca || marca.trim() === '') {
      const error = new Error()
      error.status = 400
      error.mensaje = 'La marca del producto es obligatoria.'
      throw error
    }
    if (!precioBase || precioBase <= 0) {
      const error = new Error()
      error.status = 400
      error.mensaje = 'El precio de venta debe ser mayor a cero.'
      throw error
    }
    if (stockInicial < 0) {
      const error = new Error()
      error.status = 400
      error.mensaje = 'El stock inicial no puede ser negativo.'
      throw error
    }
  }

  static validarEdicion(nombre, marca) {
    if (!nombre || nombre.trim() === '') {
      const error = new Error()
      error.status = 400
      error.mensaje = 'El nombre del producto es obligatorio.'
      throw error
    }
    if (!marca || marca.trim() === '') {
      const error = new Error()
      error.status = 400
      error.mensaje = 'La marca del producto es obligatoria.'
      throw error
    }
  }

  static async crear(distribuidorId, datos) {
    const {
      nombre, marca, descripcion, imagenUrl, categoriaId,
      magnitudValor, magnitudUnidad, stockInicial, precioBase, precioCosto,
      preciosAdicionales,
    } = datos
    const tramos = preciosAdicionales || []

    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const productoRes = await cliente.query(
        `INSERT INTO producto (
          distribuidor_id, categoria_id, nombre, marca, descripcion, imagen_url,
          magnitud_valor, magnitud_unidad, stock_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          distribuidorId, categoriaId, nombre.trim(), marca || null, descripcion || null,
          imagenUrl || null, magnitudValor ?? null, magnitudUnidad || null, stockInicial || 0,
        ]
      )
      const producto = new Producto(productoRes.rows[0])

      const precios = [await PrecioVolumen.crear(producto.id, 1, precioBase, precioCosto, cliente)]

      for (const tramo of tramos) {
        precios.push(await PrecioVolumen.crear(producto.id, tramo.cantidadMinima, tramo.precioVenta, tramo.precioCosto, cliente))
      }

      await cliente.query('COMMIT')
      return { producto, precios }
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }

  static async listarPorDistribuidor(usuarioId, filtros = {}) {
    const { categoria, visibilidad, stock } = filtros

    let condiciones = ['d.usuario_id = $1', 'p.habilitado = true']
    let params = [usuarioId]
    let contador = 2

    if (categoria) {
      condiciones.push(`c.nombre = $${contador}`)
      params.push(categoria)
      contador++
    }
    if (visibilidad) {
      condiciones.push(`p.estado_visibilidad = $${contador}`)
      params.push(visibilidad)
      contador++
    }
    if (stock === 'con_stock') {
      condiciones.push(`(p.stock_total - p.stock_reservado) > 0`)
    } else if (stock === 'sin_stock') {
      condiciones.push(`(p.stock_total - p.stock_reservado) = 0`)
    }

    const where = condiciones.join(' AND ')

    const resultado = await pool.query(
      `SELECT
         p.id, p.nombre, p.marca, p.imagen_url AS "imagenUrl", c.nombre AS categoria,
         p.magnitud_valor AS "magnitudValor", p.magnitud_unidad AS "magnitudUnidad",
         p.stock_total AS "stockTotal", p.stock_reservado AS "stockReservado",
         p.estado_visibilidad AS "estadoVisibilidad"
       FROM producto p
       JOIN categoria c ON c.id = p.categoria_id
       JOIN distribuidor d ON d.id = p.distribuidor_id
       WHERE ${where}
       ORDER BY p.fecha_creacion DESC`,
      params
    )

    return resultado.rows.map(p => ({
      id: p.id,
      nombre: p.nombre,
      marca: p.marca,
      imagenUrl: p.imagenUrl,
      categoria: p.categoria,
      magnitudValor: p.magnitudValor,
      magnitudUnidad: p.magnitudUnidad,
      stockDisponible: p.stockTotal - p.stockReservado,
      stockReservado: p.stockReservado,
      estadoVisibilidad: p.estadoVisibilidad,
    }))
  }

  static async obtenerPropio(productoId, usuarioId) {
    const res = await pool.query(
      `SELECT p.* FROM producto p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       WHERE p.id = $1 AND d.usuario_id = $2 AND p.habilitado = true`,
      [productoId, usuarioId]
    )
    if (res.rows.length === 0) return null
    return new Producto(res.rows[0])
  }

  static async listarPublicadosPorDistribuidor(distribuidorId) {
    const res = await pool.query(
      `SELECT p.id, p.nombre, p.marca, p.descripcion, p.imagen_url AS "imagenUrl",
              p.magnitud_valor AS "magnitudValor", p.magnitud_unidad AS "magnitudUnidad",
              c.nombre AS categoria
       FROM producto p
       JOIN categoria c ON c.id = p.categoria_id
       WHERE p.distribuidor_id = $1 AND p.estado_visibilidad = 'publicado' AND p.habilitado = true
       ORDER BY p.fecha_creacion DESC`,
      [distribuidorId]
    )
    return res.rows
  }

  // RF-039: ranking de productos por unidades vendidas (pedido_item.cantidad),
  // de pedidos entregados del distribuidor dentro de [fechaInicio, fechaFin),
  // ordenado de más a menos vendido. El servicio toma la cabeza para "más
  // vendidos" y la cola para "menos vendidos" de este mismo resultado, en vez
  // de pedir la lista dos veces con el ORDER BY invertido.
  static async listarVendidosPorDistribuidor(usuarioDistribuidorId, fechaInicio, fechaFin) {
    const res = await pool.query(
      `SELECT pr.id, pr.nombre, SUM(pi.cantidad) AS unidades_vendidas
       FROM pedido_item pi
       JOIN pedido p ON p.id = pi.pedido_id
       JOIN producto pr ON pr.id = pi.producto_id
       JOIN distribuidor d ON d.id = p.distribuidor_id
       WHERE d.usuario_id = $1
         AND p.estado = 'entregado'
         AND p.fecha_entregado >= $2
         AND p.fecha_entregado < $3
       GROUP BY pr.id, pr.nombre
       ORDER BY unidades_vendidas DESC`,
      [usuarioDistribuidorId, fechaInicio, fechaFin]
    )
    return res.rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      unidadesVendidas: Number(r.unidades_vendidas),
    }))
  }

  static async obtenerPrecioVolumenAplicable(productoId, cantidad, cliente = pool) {
    const res = await cliente.query(
      `SELECT * FROM precio_volumen
       WHERE producto_id = $1 AND cantidad_minima <= $2
       ORDER BY cantidad_minima DESC LIMIT 1`,
      [productoId, cantidad]
    )
    if (res.rows.length === 0) return null
    return new PrecioVolumen(res.rows[0])
  }

  async editar({ nombre, marca, descripcion, imagenUrl, categoriaId, magnitudValor, magnitudUnidad, stockTotal }) {
    if (stockTotal !== undefined && stockTotal < this.stockReservado) {
      const error = new Error()
      error.status = 422
      error.mensaje = 'No es posible reducir el stock por debajo de las unidades reservadas en pedidos activos.'
      throw error
    }

    const res = await pool.query(
      `UPDATE producto SET
         nombre = $1, marca = $2, descripcion = $3,
         imagen_url = COALESCE($4, imagen_url),
         categoria_id = $5, magnitud_valor = $6, magnitud_unidad = $7,
         stock_total = COALESCE($8, stock_total)
       WHERE id = $9
       RETURNING id, nombre, estado_visibilidad AS "estadoVisibilidad",
         stock_total AS "stockTotal", stock_reservado AS "stockReservado"`,
      [
        nombre.trim(), marca || null, descripcion || null, imagenUrl || null, categoriaId,
        magnitudValor ?? null, magnitudUnidad || null,
        stockTotal !== undefined ? stockTotal : null,
        this.id,
      ]
    )

    const r = res.rows[0]
    this.nombre = r.nombre
    this.estadoVisibilidad = r.estadoVisibilidad
    this.stockTotal = r.stockTotal
    this.stockReservado = r.stockReservado
    return true
  }

  async cambiarVisibilidad(nuevoEstado) {
    if (nuevoEstado === 'publicado') {
      const precios = await PrecioVolumen.listarPorProducto(this.id)
      if (precios.length === 0) {
        const error = new Error()
        error.status = 422
        error.mensaje = 'El producto necesita al menos un precio por volumen para poder ser publicado.'
        throw error
      }
    }

    const res = await pool.query(
      `UPDATE producto SET estado_visibilidad = $1
       WHERE id = $2
       RETURNING id, nombre, estado_visibilidad AS "estadoVisibilidad"`,
      [nuevoEstado, this.id]
    )
    this.estadoVisibilidad = res.rows[0].estadoVisibilidad
    return { id: this.id, nombre: this.nombre, estadoVisibilidad: this.estadoVisibilidad }
  }

  async tienePedidosRegistrados() {
    const res = await pool.query('SELECT 1 FROM pedido_item WHERE producto_id = $1 LIMIT 1', [this.id])
    return res.rows.length > 0
  }

  async tieneRegistrosAsociados() {
    return this.tienePedidosRegistrados()
  }

  async eliminarOdeshabilitar() {
    if (await this.tienePedidosRegistrados()) {
      await pool.query(
        `UPDATE producto SET habilitado = false, estado_visibilidad = 'pausado' WHERE id = $1`,
        [this.id]
      )
      this.habilitado = false
      this.estadoVisibilidad = 'pausado'
      return { tipoResultado: 'DESHABILITADO', mensaje: 'El producto fue eliminado correctamente.' }
    }

    await pool.query('DELETE FROM precio_volumen WHERE producto_id = $1', [this.id])
    await pool.query('DELETE FROM producto WHERE id = $1', [this.id])
    return { tipoResultado: 'ELIMINADO_FISICAMENTE', mensaje: 'El producto fue eliminado correctamente.' }
  }

  async configurarUmbralMinimo(valor) {
    const res = await pool.query(
      `UPDATE producto SET umbral_minimo_stock = $1
       WHERE id = $2
       RETURNING id, umbral_minimo_stock AS "umbralMinimoStock"`,
      [valor, this.id]
    )
    this.umbralMinimoStock = res.rows[0].umbralMinimoStock
    return { id: this.id, umbralMinimoStock: this.umbralMinimoStock }
  }

  async reservarStock(cantidad, cliente = pool) {
    await cliente.query('UPDATE producto SET stock_reservado = stock_reservado + $1 WHERE id = $2', [cantidad, this.id])
    this.stockReservado += Number(cantidad)
  }

  async liberarStock(cantidad, cliente = pool) {
    await cliente.query('UPDATE producto SET stock_reservado = stock_reservado - $1 WHERE id = $2', [cantidad, this.id])
    this.stockReservado -= Number(cantidad)
  }

  async confirmarSalidaStock(cantidad, cliente = pool) {
    await cliente.query(
      'UPDATE producto SET stock_total = stock_total - $1, stock_reservado = stock_reservado - $1 WHERE id = $2',
      [cantidad, this.id]
    )
    this.stockTotal -= Number(cantidad)
    this.stockReservado -= Number(cantidad)
  }

  static async notificarSiCruzaUmbral(cliente, { nombre, umbralMinimoStock, usuarioDistribuidorId, disponibleAntes, disponibleDespues }) {
    if (umbralMinimoStock === null || umbralMinimoStock === undefined) return
    const umbral = Number(umbralMinimoStock)
    if (disponibleAntes >= umbral && disponibleDespues < umbral) {
      await Notificacion.crear(
        usuarioDistribuidorId,
        'stock_bajo',
        `El stock disponible de "${nombre}" está por debajo del umbral mínimo configurado.`,
        null,
        cliente
      )
    }
  }
}

export default Producto
