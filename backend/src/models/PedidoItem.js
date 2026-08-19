import pool from '../config/db.js'

class PedidoItem {
  constructor(data) {
    this.id = data.id
    this.pedidoId = data.pedido_id
    this.productoId = data.producto_id
    this.precioVolumenId = data.precio_volumen_id
    this.cantidad = data.cantidad
    this.precioVentaCongelado = data.precio_venta_congelado
  }

  congelarPrecio(precioVolumen) {
    this.precioVolumenId = precioVolumen.id
    this.precioVentaCongelado = precioVolumen.precioVenta
  }

  static async crear(pedidoId, productoId, precioVolumenId, cantidad, precioVentaCongelado, cliente = pool) {
    const res = await cliente.query(
      `INSERT INTO pedido_item (pedido_id, producto_id, precio_volumen_id, cantidad, precio_venta_congelado)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [pedidoId, productoId, precioVolumenId, cantidad, precioVentaCongelado]
    )
    return new PedidoItem(res.rows[0])
  }

  static async listarPorPedido(pedidoId, cliente = pool) {
    const res = await cliente.query(
      `SELECT pi.*, pr.nombre AS nombre_producto, pr.stock_total, pr.stock_reservado, pr.umbral_minimo_stock
       FROM pedido_item pi
       JOIN producto pr ON pr.id = pi.producto_id
       WHERE pi.pedido_id = $1
       ORDER BY pi.id`,
      [pedidoId]
    )
    return res.rows.map(r => {
      const item = new PedidoItem(r)
      item.nombreProducto = r.nombre_producto
      item.stockTotalProducto = r.stock_total
      item.stockReservadoProducto = r.stock_reservado
      item.umbralMinimoStockProducto = r.umbral_minimo_stock
      return item
    })
  }
}

export default PedidoItem
