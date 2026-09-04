import pool from '../config/db.js'

class PropuestaSustitucion {
  constructor(data) {
    this.id = data.id
    this.pedidoItemId = data.pedido_item_id
    this.productoSustitutoId = data.producto_sustituto_id
    this.cantidad = data.cantidad
    this.precioVolumenId = data.precio_volumen_id
    this.precioVentaCongelado = data.precio_venta_congelado
    this.estado = data.estado
    this.fechaCreacion = data.fecha_creacion
  }

  estaPendiente() {
    return this.estado === 'pendiente'
  }

  // RF-025: el distribuidor solo propone el producto sustituto. La cantidad
  // y el precio no se definen acá — los elige el comprador al responder
  // (RF-026), porque es él quien decide cuánto necesita del sustituto; se
  // congelan recién en aceptar(), igual que pedido_item se congela al
  // confirmar el pedido.
  static async crear(pedidoItemId, productoSustitutoId, cliente = pool) {
    const res = await cliente.query(
      `INSERT INTO propuesta_sustitucion (pedido_item_id, producto_sustituto_id, estado)
       VALUES ($1, $2, 'pendiente') RETURNING *`,
      [pedidoItemId, productoSustitutoId]
    )
    return new PropuestaSustitucion(res.rows[0])
  }

  static async obtenerPendientePorPedidoItem(pedidoItemId, cliente = pool) {
    const res = await cliente.query(
      `SELECT * FROM propuesta_sustitucion WHERE pedido_item_id = $1 AND estado = 'pendiente'`,
      [pedidoItemId]
    )
    if (res.rows.length === 0) return null
    return new PropuestaSustitucion(res.rows[0])
  }

  // Trae la propuesta junto con el contexto necesario para autorizar y
  // notificar la respuesta (RF-026): el pedido al que pertenece (para
  // verificar dueño y estado) y los nombres de ambos productos (para el
  // mensaje de notificación al distribuidor).
  static async obtenerConContexto(id, cliente = pool) {
    const res = await cliente.query(
      `SELECT
         ps.id, ps.pedido_item_id, ps.producto_sustituto_id, ps.cantidad,
         ps.precio_volumen_id, ps.precio_venta_congelado, ps.estado,
         p.id AS pedido_id, p.estado AS estado_pedido, p.comprador_id,
         d.usuario_id AS distribuidor_usuario_id, d.nombre_comercial,
         prOriginal.nombre AS nombre_producto_original,
         prSustituto.nombre AS nombre_producto_sustituto
       FROM propuesta_sustitucion ps
       JOIN pedido_item pi ON pi.id = ps.pedido_item_id
       JOIN pedido p ON p.id = pi.pedido_id
       JOIN distribuidor d ON d.id = p.distribuidor_id
       JOIN producto prOriginal ON prOriginal.id = pi.producto_id
       JOIN producto prSustituto ON prSustituto.id = ps.producto_sustituto_id
       WHERE ps.id = $1`,
      [id]
    )
    if (res.rows.length === 0) return null
    const fila = res.rows[0]
    return {
      propuesta: new PropuestaSustitucion(fila),
      pedidoId: fila.pedido_id,
      estadoPedido: fila.estado_pedido,
      compradorId: fila.comprador_id,
      distribuidorUsuarioId: fila.distribuidor_usuario_id,
      nombreDistribuidor: fila.nombre_comercial,
      nombreProductoOriginal: fila.nombre_producto_original,
      nombreProductoSustituto: fila.nombre_producto_sustituto,
    }
  }

  // RF-026: el comprador elige la cantidad al aceptar — recién acá se
  // congelan cantidad y precio del sustituto, nunca antes.
  async aceptar(cantidad, precioVolumenId, precioVentaCongelado, cliente = pool) {
    if (!this.estaPendiente()) {
      throw Object.assign(new Error('Esta propuesta ya fue respondida y no puede modificarse.'), { status: 409 })
    }
    await cliente.query(
      `UPDATE propuesta_sustitucion
       SET estado = 'aceptada', cantidad = $2, precio_volumen_id = $3, precio_venta_congelado = $4
       WHERE id = $1`,
      [this.id, cantidad, precioVolumenId, precioVentaCongelado]
    )
    this.estado = 'aceptada'
    this.cantidad = cantidad
    this.precioVolumenId = precioVolumenId
    this.precioVentaCongelado = precioVentaCongelado
  }

  async rechazar(cliente = pool) {
    if (!this.estaPendiente()) {
      throw Object.assign(new Error('Esta propuesta ya fue respondida y no puede modificarse.'), { status: 409 })
    }
    await cliente.query(`UPDATE propuesta_sustitucion SET estado = 'rechazada' WHERE id = $1`, [this.id])
    this.estado = 'rechazada'
  }
}

export default PropuestaSustitucion
