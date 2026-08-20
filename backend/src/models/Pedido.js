import pool from '../config/db.js'
import Notificacion from './Notificacion.js'
import Producto from './Producto.js'
import PedidoItem from './PedidoItem.js'

const MOTIVOS_RECHAZO_PENDIENTE = [
  'Sin stock del producto solicitado',
  'Producto discontinuado',
  'Pedido fuera de la zona de entrega',
  'Error en los datos del pedido',
  'Distribuidora no disponible en la fecha solicitada',
]

const SIGUIENTE_ESTADO = { aceptado: 'en_camino', en_camino: 'entregado' }

function mensajeCambioEstado(nombreDistribuidor, nuevoEstado, motivo) {
  switch (nuevoEstado) {
    case 'aceptado': return `Tu pedido de ${nombreDistribuidor} fue aceptado.`
    case 'en_camino': return `Tu pedido de ${nombreDistribuidor} está en camino.`
    case 'entregado': return `Tu pedido de ${nombreDistribuidor} fue entregado.`
    case 'rechazado': return `Tu pedido de ${nombreDistribuidor} fue rechazado. Motivo: ${motivo}`
    default: return `Tu pedido de ${nombreDistribuidor} cambió de estado.`
  }
}

class Pedido {
  constructor(data) {
    this.id = data.id
    this.compradorId = data.comprador_id
    this.distribuidorId = data.distribuidor_id
    this.direccionEntrega = data.direccion_entrega
    this.latitud = data.latitud
    this.longitud = data.longitud
    this.estado = data.estado
    this.motivoRechazo = data.motivo_rechazo
    this.fechaCreacion = data.fecha_creacion
    this.fechaEntregado = data.fecha_entregado
  }

  static async confirmarDesdeCarrito(compradorId, direccionEntrega, latitud, longitud, items) {
    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const pedidosCreados = []

      const porDistribuidor = {}
      for (const item of items) {
        const key = item.distribuidorId
        if (!porDistribuidor[key]) porDistribuidor[key] = []
        porDistribuidor[key].push(item)
      }

      for (const [distribuidorId, itemsGrupo] of Object.entries(porDistribuidor)) {
        const resPedido = await cliente.query(
          `INSERT INTO pedido (comprador_id, distribuidor_id, direccion_entrega, latitud, longitud, estado)
           VALUES ($1, $2, $3, $4, $5, 'pendiente')
           RETURNING id`,
          [compradorId, Number(distribuidorId), direccionEntrega, latitud ?? null, longitud ?? null]
        )
        const pedidoId = resPedido.rows[0].id

        for (const item of itemsGrupo) {
          const precioAplicable = await Producto.obtenerPrecioVolumenAplicable(item.productoId, item.cantidad, cliente)
          if (!precioAplicable) {
            throw Object.assign(new Error('No hay un precio por volumen disponible para uno de los productos.'), { status: 400 })
          }
          await PedidoItem.crear(pedidoId, item.productoId, precioAplicable.id, item.cantidad, precioAplicable.precioVenta, cliente)
        }

        const resInfo = await cliente.query(
          `SELECT d.usuario_id AS "distribuidorUsuarioId", u.nombre_completo AS "nombreComprador"
           FROM distribuidor d
           JOIN usuario u ON u.id = $2
           WHERE d.id = $1`,
          [Number(distribuidorId), compradorId]
        )
        const { distribuidorUsuarioId, nombreComprador } = resInfo.rows[0]

        await Notificacion.crear(distribuidorUsuarioId, 'pedido_entrante', `Nuevo pedido de ${nombreComprador}.`, pedidoId, cliente)

        pedidosCreados.push({ pedidoId, distribuidorId: Number(distribuidorId) })
      }

      await cliente.query('COMMIT')
      return pedidosCreados
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }

  static async listarHistorialDistribuidor(usuarioId) {
    const res = await pool.query(
      `SELECT
         p.id, p.estado, p.fecha_creacion AS "fechaCreacion", p.direccion_entrega AS "direccionEntrega",
         p.latitud, p.longitud,
         u.nombre_completo AS "nombreComprador", u.telefono AS "telefonoComprador",
         COALESCE(SUM(pi.cantidad * pi.precio_venta_congelado), 0) AS total,
         COALESCE(
           json_agg(
             json_build_object(
               'productoId', pr.id, 'nombreProducto', pr.nombre, 'imagenUrl', pr.imagen_url,
               'cantidad', pi.cantidad, 'disponible', pr.habilitado
             ) ORDER BY pi.id
           ) FILTER (WHERE pi.id IS NOT NULL),
           '[]'
         ) AS items
       FROM pedido p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       JOIN usuario u ON u.id = p.comprador_id
       LEFT JOIN pedido_item pi ON pi.pedido_id = p.id
       LEFT JOIN producto pr ON pr.id = pi.producto_id
       WHERE d.usuario_id = $1
       GROUP BY p.id, u.nombre_completo, u.telefono
       ORDER BY p.fecha_creacion DESC`,
      [usuarioId]
    )
    return res.rows
  }

  static async listarHistorialComprador(compradorId) {
    const res = await pool.query(
      `SELECT
         p.id, p.estado, p.fecha_creacion AS "fechaCreacion", p.direccion_entrega AS "direccionEntrega",
         p.latitud, p.longitud, d.nombre_comercial AS "nombreDistribuidor",
         COALESCE(SUM(pi.cantidad * pi.precio_venta_congelado), 0) AS total,
         COALESCE(
           json_agg(
             json_build_object(
               'productoId', pr.id, 'nombreProducto', pr.nombre, 'imagenUrl', pr.imagen_url,
               'cantidad', pi.cantidad, 'disponible', pr.habilitado
             ) ORDER BY pi.id
           ) FILTER (WHERE pi.id IS NOT NULL),
           '[]'
         ) AS items
       FROM pedido p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       LEFT JOIN pedido_item pi ON pi.pedido_id = p.id
       LEFT JOIN producto pr ON pr.id = pi.producto_id
       WHERE p.comprador_id = $1
       GROUP BY p.id, d.nombre_comercial
       ORDER BY p.fecha_creacion DESC`,
      [compradorId]
    )
    return res.rows
  }

  static async obtenerDetalleComprador(pedidoId, compradorId) {
    const res = await pool.query(
      `SELECT
         p.id, p.estado, p.fecha_creacion AS "fechaCreacion", p.direccion_entrega AS "direccionEntrega",
         p.motivo_rechazo AS "motivoRechazo", p.latitud, p.longitud,
         d.nombre_comercial AS "nombreDistribuidor",
         COALESCE(SUM(pi.cantidad * pi.precio_venta_congelado), 0) AS total,
         COALESCE(
           json_agg(
             json_build_object(
               'productoId', pr.id, 'nombreProducto', pr.nombre, 'imagenUrl', pr.imagen_url,
               'cantidad', pi.cantidad, 'precioVentaCongelado', pi.precio_venta_congelado,
               'disponible', pr.habilitado
             ) ORDER BY pi.id
           ) FILTER (WHERE pi.id IS NOT NULL),
           '[]'
         ) AS items
       FROM pedido p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       LEFT JOIN pedido_item pi ON pi.pedido_id = p.id
       LEFT JOIN producto pr ON pr.id = pi.producto_id
       WHERE p.id = $1 AND p.comprador_id = $2
       GROUP BY p.id, d.nombre_comercial`,
      [pedidoId, compradorId]
    )
    if (res.rows.length === 0) return null
    return res.rows[0]
  }

  static async listarActivosDistribuidor(usuarioId) {
    const res = await pool.query(
      `SELECT
         p.id, p.estado, p.fecha_creacion AS "fechaCreacion", p.direccion_entrega AS "direccionEntrega",
         p.latitud, p.longitud,
         u.nombre_completo AS "nombreComprador", u.telefono AS "telefonoComprador",
         COALESCE(SUM(pi.cantidad * pi.precio_venta_congelado), 0) AS total,
         COALESCE(
           json_agg(
             json_build_object(
               'productoId', pr.id, 'nombreProducto', pr.nombre, 'imagenUrl', pr.imagen_url,
               'cantidad', pi.cantidad, 'stockDisponible', (pr.stock_total - pr.stock_reservado)
             ) ORDER BY pi.id
           ) FILTER (WHERE pi.id IS NOT NULL),
           '[]'
         ) AS items
       FROM pedido p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       JOIN usuario u ON u.id = p.comprador_id
       LEFT JOIN pedido_item pi ON pi.pedido_id = p.id
       LEFT JOIN producto pr ON pr.id = pi.producto_id
       WHERE d.usuario_id = $1
         AND p.estado IN ('pendiente', 'aceptado', 'en_camino')
       GROUP BY p.id, u.nombre_completo, u.telefono
       ORDER BY p.fecha_creacion DESC`,
      [usuarioId]
    )
    return res.rows
  }

  static async obtenerDetalleDistribuidor(pedidoId, distribuidorUsuarioId) {
    const res = await pool.query(
      `SELECT
         p.id, p.estado, p.fecha_creacion AS "fechaCreacion", p.direccion_entrega AS "direccionEntrega",
         p.motivo_rechazo AS "motivoRechazo", p.latitud, p.longitud,
         u.nombre_completo AS "nombreComprador", u.telefono AS "telefonoComprador",
         COALESCE(SUM(pi.cantidad * pi.precio_venta_congelado), 0) AS total,
         COALESCE(
           json_agg(
             json_build_object(
               'productoId', pr.id, 'nombreProducto', pr.nombre, 'imagenUrl', pr.imagen_url,
               'cantidad', pi.cantidad, 'precioVentaCongelado', pi.precio_venta_congelado,
               'stockDisponible', (pr.stock_total - pr.stock_reservado)
             ) ORDER BY pi.id
           ) FILTER (WHERE pi.id IS NOT NULL),
           '[]'
         ) AS items
       FROM pedido p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       JOIN usuario u ON u.id = p.comprador_id
       LEFT JOIN pedido_item pi ON pi.pedido_id = p.id
       LEFT JOIN producto pr ON pr.id = pi.producto_id
       WHERE p.id = $1 AND d.usuario_id = $2
       GROUP BY p.id, u.nombre_completo, u.telefono`,
      [pedidoId, distribuidorUsuarioId]
    )
    if (res.rows.length === 0) return null
    return res.rows[0]
  }

  // RF-039: total facturado y cantidad de pedidos entregados, del distribuidor,
  // dentro de [fechaInicio, fechaFin). Se filtra por fecha_entregado (no
  // fecha_creacion) porque un pedido creado en un período y entregado en otro
  // debe contar en el período de su entrega (ver nota de la columna en el MER).
  static async calcularTotalesEntregados(usuarioDistribuidorId, fechaInicio, fechaFin) {
    const res = await pool.query(
      `SELECT
         COALESCE(SUM(pi.cantidad * pi.precio_venta_congelado), 0) AS total_facturado,
         COUNT(DISTINCT p.id) AS cantidad_pedidos_entregados
       FROM pedido p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       LEFT JOIN pedido_item pi ON pi.pedido_id = p.id
       WHERE d.usuario_id = $1
         AND p.estado = 'entregado'
         AND p.fecha_entregado >= $2
         AND p.fecha_entregado < $3`,
      [usuarioDistribuidorId, fechaInicio, fechaFin]
    )
    const fila = res.rows[0]
    return {
      totalFacturado: Number(fila.total_facturado),
      cantidadPedidosEntregados: Number(fila.cantidad_pedidos_entregados),
    }
  }

  static async obtenerPropioDistribuidor(pedidoId, distribuidorUsuarioId, cliente = pool) {
    const res = await cliente.query(
      `SELECT p.*, u.telefono AS telefono_comprador, u.nombre_completo AS nombre_comprador,
              d.nombre_comercial AS nombre_distribuidor
       FROM pedido p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       JOIN usuario u ON u.id = p.comprador_id
       WHERE p.id = $1 AND d.usuario_id = $2`,
      [pedidoId, distribuidorUsuarioId]
    )
    if (res.rows.length === 0) return null
    const pedido = new Pedido(res.rows[0])
    pedido.nombreComprador = res.rows[0].nombre_comprador
    pedido.telefonoComprador = res.rows[0].telefono_comprador
    pedido.nombreDistribuidor = res.rows[0].nombre_distribuidor
    return pedido
  }

  construirTextoWhatsapp(items) {
    const lineasProductos = items
      .map(item => `- ${item.nombreProducto} × ${Number(item.cantidad)} u.`)
      .join('\n')
    const total = items.reduce((acc, item) => acc + Number(item.cantidad) * Number(item.precioVentaCongelado), 0)
    return `Hola ${this.nombreComprador}, tu pedido #${this.id} fue aceptado.\n\nDetalle:\n${lineasProductos}\n\nTotal: $${total.toLocaleString('es-AR')}\n\nGracias por tu compra.`
  }

  async notificarCambioEstado(cliente, nuevoEstado, motivo) {
    await Notificacion.crear(
      this.compradorId,
      'cambio_estado_pedido',
      mensajeCambioEstado(this.nombreDistribuidor, nuevoEstado, motivo),
      this.id,
      cliente
    )
  }

  async aceptar(distribuidorUsuarioId) {
    if (this.estado !== 'pendiente') {
      throw Object.assign(new Error('Solo se pueden aceptar pedidos en estado Pendiente.'), { status: 409 })
    }

    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const items = await PedidoItem.listarPorPedido(this.id, cliente)

      await cliente.query(`UPDATE pedido SET estado = 'aceptado' WHERE id = $1`, [this.id])

      for (const item of items) {
        const disponibleAntes = item.stockTotalProducto - item.stockReservadoProducto
        await cliente.query(
          `UPDATE producto SET stock_reservado = stock_reservado + $1 WHERE id = $2`,
          [item.cantidad, item.productoId]
        )
        await Producto.notificarSiCruzaUmbral(cliente, {
          nombre: item.nombreProducto,
          umbralMinimoStock: item.umbralMinimoStockProducto,
          usuarioDistribuidorId: distribuidorUsuarioId,
          disponibleAntes,
          disponibleDespues: item.stockTotalProducto - (item.stockReservadoProducto + Number(item.cantidad)),
        })
      }

      const mensajeWhatsapp = this.construirTextoWhatsapp(items)
      const telefono = this.telefonoComprador.replace(/^\+/, '')
      const deepLink = `https://wa.me/${telefono}?text=${encodeURIComponent(mensajeWhatsapp)}`

      this.estado = 'aceptado'
      await this.notificarCambioEstado(cliente, 'aceptado')

      await cliente.query('COMMIT')
      return { deepLink }
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }

  async rechazar(motivo) {
    if (this.estado !== 'pendiente' && this.estado !== 'en_camino') {
      throw Object.assign(new Error('Solo se pueden rechazar pedidos en estado Pendiente o En camino.'), { status: 409 })
    }

    if (this.estado === 'pendiente' && !MOTIVOS_RECHAZO_PENDIENTE.includes(motivo)) {
      throw Object.assign(new Error('Ingresá un motivo de rechazo antes de confirmar.'), { status: 400 })
    }

    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const estadoAnterior = this.estado

      await cliente.query(
        `UPDATE pedido SET estado = 'rechazado', motivo_rechazo = $1 WHERE id = $2`,
        [motivo, this.id]
      )

      if (estadoAnterior === 'en_camino') {
        const items = await PedidoItem.listarPorPedido(this.id, cliente)
        for (const item of items) {
          await cliente.query(
            `UPDATE producto SET stock_reservado = stock_reservado - $1 WHERE id = $2`,
            [item.cantidad, item.productoId]
          )
        }
      }

      this.estado = 'rechazado'
      this.motivoRechazo = motivo
      await this.notificarCambioEstado(cliente, 'rechazado', motivo)

      await cliente.query('COMMIT')
      return { id: this.id, estado: 'rechazado' }
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }

  async avanzarEstado() {
    const nuevoEstado = SIGUIENTE_ESTADO[this.estado]
    if (!nuevoEstado) {
      throw Object.assign(new Error('Este pedido no se puede avanzar de estado.'), { status: 409 })
    }

    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      if (nuevoEstado === 'entregado') {
        await cliente.query(
          `UPDATE pedido SET estado = 'entregado', fecha_entregado = NOW() WHERE id = $1`,
          [this.id]
        )
        const items = await PedidoItem.listarPorPedido(this.id, cliente)
        for (const item of items) {
          await cliente.query(
            `UPDATE producto
             SET stock_total = stock_total - $1, stock_reservado = stock_reservado - $1
             WHERE id = $2`,
            [item.cantidad, item.productoId]
          )
        }
      } else {
        await cliente.query(`UPDATE pedido SET estado = $1 WHERE id = $2`, [nuevoEstado, this.id])
      }

      this.estado = nuevoEstado
      await this.notificarCambioEstado(cliente, nuevoEstado)

      await cliente.query('COMMIT')
      return { id: this.id, estado: nuevoEstado }
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }
}

export default Pedido
