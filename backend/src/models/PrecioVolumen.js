import pool from '../config/db.js'

class PrecioVolumen {
  constructor(data) {
    this.id = data.id
    this.productoId = data.producto_id
    this.cantidadMinima = data.cantidad_minima
    this.precioVenta = data.precio_venta
    this.precioCosto = data.precio_costo
  }

  toJSON() {
    return {
      id: this.id,
      cantidadMinima: this.cantidadMinima,
      precioVenta: this.precioVenta,
      precioCosto: this.precioCosto,
    }
  }

  static validarDatos(precioVenta, precioCosto, cantidadMinima) {
    if (!precioVenta || precioVenta <= 0) {
      const e = new Error()
      e.status = 400
      e.mensaje = 'El precio de venta debe ser mayor a cero.'
      throw e
    }
    if (precioCosto !== null && precioCosto !== undefined && precioCosto < 0) {
      const e = new Error()
      e.status = 400
      e.mensaje = 'El precio de costo no puede ser negativo.'
      throw e
    }
    if (!cantidadMinima || cantidadMinima <= 0) {
      const e = new Error()
      e.status = 400
      e.mensaje = 'La cantidad mínima debe ser mayor a cero.'
      throw e
    }
  }

  static async listarPorProducto(productoId) {
    const res = await pool.query(
      'SELECT * FROM precio_volumen WHERE producto_id = $1 ORDER BY cantidad_minima ASC',
      [productoId]
    )
    return res.rows.map(r => new PrecioVolumen(r))
  }

  static async obtenerPorId(precioId, productoId) {
    const res = await pool.query(
      'SELECT * FROM precio_volumen WHERE id = $1 AND producto_id = $2',
      [precioId, productoId]
    )
    if (res.rows.length === 0) return null
    return new PrecioVolumen(res.rows[0])
  }

  static async crear(productoId, cantidadMinima, precioVenta, precioCosto, cliente = pool) {
    const res = await cliente.query(
      `INSERT INTO precio_volumen (producto_id, cantidad_minima, precio_venta, precio_costo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [productoId, cantidadMinima, precioVenta, precioCosto ?? null]
    )
    return new PrecioVolumen(res.rows[0])
  }

  static async actualizarPrecioCostoBase(productoId, precioCosto) {
    await pool.query(
      'UPDATE precio_volumen SET precio_costo = $1 WHERE producto_id = $2 AND cantidad_minima = 1',
      [precioCosto, productoId]
    )
  }

  async editar(cantidadMinima, precioVenta, precioCosto) {
    const res = await pool.query(
      `UPDATE precio_volumen SET cantidad_minima = $1, precio_venta = $2, precio_costo = $3
       WHERE id = $4 AND producto_id = $5 RETURNING *`,
      [cantidadMinima, precioVenta, precioCosto ?? null, this.id, this.productoId]
    )
    if (res.rows.length === 0) {
      const e = new Error()
      e.status = 404
      e.mensaje = 'Precio no encontrado.'
      throw e
    }
    const actualizado = new PrecioVolumen(res.rows[0])
    Object.assign(this, actualizado)
    return true
  }

  async tienePedidosRegistrados() {
    const res = await pool.query('SELECT 1 FROM pedido_item WHERE precio_volumen_id = $1 LIMIT 1', [this.id])
    return res.rows.length > 0
  }

  async eliminar() {
    if (Number(this.cantidadMinima) === 1) {
      const e = new Error()
      e.status = 422
      e.mensaje = 'No se puede eliminar el precio de la presentación.'
      throw e
    }

    if (await this.tienePedidosRegistrados()) {
      await pool.query(
        `UPDATE producto SET habilitado = false, estado_visibilidad = 'pausado' WHERE id = $1`,
        [this.productoId]
      )
      return {
        tipoResultado: 'PRODUCTO_DESHABILITADO',
        mensaje: 'Este precio tiene pedidos asociados y no puede eliminarse individualmente. Por eso, el producto fue pausado y deshabilitado, conservando el historial de esos pedidos.',
      }
    }

    await pool.query('DELETE FROM precio_volumen WHERE id = $1 AND producto_id = $2', [this.id, this.productoId])
    return { tipoResultado: 'ELIMINADO', mensaje: 'El precio por volumen fue eliminado correctamente.' }
  }

  // RF-040: rentabilidad de este precio por volumen. Solo disponible si
  // precioCosto está registrado (no es null) — si no lo está, se devuelve
  // tienePrecioCostoRegistrado: false y las diferencias en null, para que la
  // capa de presentación muestre el indicador "—" en lugar de calcular.
  calcularRentabilidad() {
    const precioVenta = Number(this.precioVenta)
    const tienePrecioCostoRegistrado = this.precioCosto !== null && this.precioCosto !== undefined
    const precioCosto = tienePrecioCostoRegistrado ? Number(this.precioCosto) : null

    return {
      precioVolumenId: this.id,
      productoId: this.productoId,
      cantidadMinima: this.cantidadMinima,
      precioVenta: this.precioVenta,
      precioCosto: this.precioCosto,
      tienePrecioCostoRegistrado,
      diferenciaPesos: tienePrecioCostoRegistrado ? precioVenta - precioCosto : null,
      diferenciaPorcentaje: tienePrecioCostoRegistrado && precioCosto > 0
        ? ((precioVenta - precioCosto) / precioCosto) * 100
        : null,
    }
  }

  // RF-040: rentabilidad de cada precio por volumen de los productos
  // habilitados del distribuidor (mismo filtro que Producto.listarPorDistribuidor).
  static async listarConRentabilidadPorDistribuidor(usuarioDistribuidorId) {
    const res = await pool.query(
      `SELECT pv.id, pv.producto_id, pv.cantidad_minima, pv.precio_venta, pv.precio_costo,
              pr.nombre AS producto_nombre
       FROM precio_volumen pv
       JOIN producto pr ON pr.id = pv.producto_id
       JOIN distribuidor d ON d.id = pr.distribuidor_id
       WHERE d.usuario_id = $1 AND pr.habilitado = true
       ORDER BY pr.nombre ASC, pv.cantidad_minima ASC`,
      [usuarioDistribuidorId]
    )
    return res.rows.map(r => ({
      ...new PrecioVolumen(r).calcularRentabilidad(),
      productoNombre: r.producto_nombre,
    }))
  }

  static async aplicarDescuentoTotal(productoId, porcentaje) {
    const factor = 1 - porcentaje / 100
    await pool.query(
      `UPDATE precio_volumen SET precio_venta = ROUND((precio_venta * $1)::numeric, 2)
       WHERE producto_id = $2`,
      [factor, productoId]
    )
  }
}

export default PrecioVolumen
