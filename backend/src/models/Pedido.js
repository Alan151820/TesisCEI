import pool from '../config/db.js'
import Notificacion from './Notificacion.js'
import Producto from './Producto.js'
import PedidoItem from './PedidoItem.js'
import PropuestaSustitucion from './PropuestaSustitucion.js'

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

  // RF-029/RF-051: panel único de pedidos del distribuidor, en cualquier
  // estado (ya no hay pestañas separadas "Activos"/"Historial"). Orden:
  // Pendiente (necesita acción) → Aceptado → En camino (todavía activos) →
  // Rechazado → Cancelado → Entregado (terminales, confirmado con el
  // usuario), y dentro de cada grupo, de más reciente a más antiguo.
  // Cancelado (RF-069) se agrupa junto a Rechazado: ambos son terminales
  // "no exitosos" que ya no requieren acción del distribuidor.
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
               'cantidad', pi.cantidad, 'disponible', pr.habilitado,
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
       WHERE d.usuario_id = $1
       GROUP BY p.id, u.nombre_completo, u.telefono
       ORDER BY
         CASE p.estado
           WHEN 'pendiente' THEN 1
           WHEN 'aceptado' THEN 2
           WHEN 'en_camino' THEN 3
           WHEN 'rechazado' THEN 4
           WHEN 'cancelado' THEN 4
           WHEN 'entregado' THEN 5
         END,
         p.fecha_creacion DESC`,
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

  // RF-039: total facturado y cantidad de pedidos entregados, del
  // distribuidor, dentro de [fechaInicio, fechaFin). Se filtra por
  // fecha_entregado (no fecha_creacion) porque un pedido creado en un
  // período y entregado en otro debe contar en el período de su entrega.
  static async calcularTotalesEntregados(usuarioDistribuidorId, fechaInicio, fechaFin) {
    const res = await pool.query(
      `SELECT
         COUNT(DISTINCT p.id)::int AS "cantidadPedidosEntregados",
         COALESCE(SUM(pi.cantidad * pi.precio_venta_congelado), 0) AS "totalFacturado"
       FROM pedido p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       LEFT JOIN pedido_item pi ON pi.pedido_id = p.id
       WHERE d.usuario_id = $1 AND p.estado = 'entregado'
         AND p.fecha_entregado >= $2 AND p.fecha_entregado < $3`,
      [usuarioDistribuidorId, fechaInicio, fechaFin]
    )
    return {
      totalFacturado: Number(res.rows[0].totalFacturado),
      cantidadPedidosEntregados: res.rows[0].cantidadPedidosEntregados,
    }
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

  // RF-043: pedidos elegibles para incluir en una planificación de reparto:
  // "Aceptado" (con dirección de entrega registrada — siempre, desde que
  // confirmar el pedido exige coordenadas, RF-008), del distribuidor, que
  // todavía no están en un plan de reparto no finalizado.
  static async listarDisponiblesRepartoDistribuidor(usuarioId, planIdIncluir = null) {
    const res = await pool.query(
      `SELECT
         p.id, p.direccion_entrega AS "direccionEntrega", p.latitud, p.longitud,
         u.nombre_completo AS "nombreComprador",
         COALESCE(
           json_agg(
             json_build_object('nombreProducto', pr.nombre, 'cantidad', pi.cantidad)
             ORDER BY pi.id
           ) FILTER (WHERE pi.id IS NOT NULL),
           '[]'
         ) AS items
       FROM pedido p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       JOIN usuario u ON u.id = p.comprador_id
       LEFT JOIN pedido_item pi ON pi.pedido_id = p.id
       LEFT JOIN producto pr ON pr.id = pi.producto_id
       WHERE d.usuario_id = $1 AND p.estado = 'aceptado'
         AND NOT EXISTS (
           SELECT 1 FROM parada_reparto pr2
           JOIN plan_reparto plr ON plr.id = pr2.plan_reparto_id
           WHERE pr2.pedido_id = p.id AND plr.estado != 'finalizado'
             AND plr.id IS DISTINCT FROM $2
         )
       GROUP BY p.id, u.nombre_completo
       ORDER BY p.fecha_creacion ASC`,
      [usuarioId, planIdIncluir]
    )
    return res.rows
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

  // RF-069: fetch-y-scope simétrico a obtenerPropioDistribuidor, pero
  // verificando que el pedido pertenezca al comprador que pide cancelarlo.
  static async obtenerPropioComprador(pedidoId, compradorId, cliente = pool) {
    const res = await cliente.query(
      `SELECT p.*, d.nombre_comercial AS nombre_distribuidor
       FROM pedido p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       WHERE p.id = $1 AND p.comprador_id = $2`,
      [pedidoId, compradorId]
    )
    if (res.rows.length === 0) return null
    const pedido = new Pedido(res.rows[0])
    pedido.nombreDistribuidor = res.rows[0].nombre_distribuidor
    return pedido
  }

  // RF-025: el distribuidor propone un producto de su propio catálogo para
  // sustituir un ítem de un pedido "Pendiente". Solo el producto — la
  // cantidad y el precio los define el comprador al responder (RF-026, ver
  // PropuestaSustitucion.aceptar), porque es él quien decide cuánto necesita
  // del sustituto (confirmado con el usuario). No modifica pedido_item ni el
  // estado del pedido (queda "Pendiente" hasta que el comprador responda) —
  // solo registra la propuesta y notifica al comprador.
  async proponerSustituto(pedidoItemId, productoSustitutoId) {
    if (this.estado !== 'pendiente') {
      throw Object.assign(new Error('Solo se puede proponer sustitución en pedidos en estado Pendiente.'), { status: 409 })
    }

    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const itemRes = await cliente.query(
        `SELECT id FROM pedido_item WHERE id = $1 AND pedido_id = $2`,
        [pedidoItemId, this.id]
      )
      if (itemRes.rows.length === 0) {
        throw Object.assign(new Error('El ítem no pertenece a este pedido.'), { status: 404 })
      }

      const productoRes = await cliente.query(
        `SELECT id FROM producto WHERE id = $1 AND distribuidor_id = $2`,
        [productoSustitutoId, this.distribuidorId]
      )
      if (productoRes.rows.length === 0) {
        throw Object.assign(new Error('El producto sustituto debe pertenecer a tu catálogo.'), { status: 400 })
      }

      const existente = await PropuestaSustitucion.obtenerPendientePorPedidoItem(pedidoItemId, cliente)
      if (existente) {
        throw Object.assign(new Error('Ya existe una propuesta de sustitución pendiente para este ítem.'), { status: 409 })
      }

      const propuesta = await PropuestaSustitucion.crear(pedidoItemId, productoSustitutoId, cliente)

      await Notificacion.crear(
        this.compradorId,
        'propuesta_sustitucion',
        `El distribuidor te propuso un producto sustituto para uno de los artículos de tu pedido #${this.id}.`,
        this.id,
        cliente
      )

      await cliente.query('COMMIT')
      return propuesta
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
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

  // RF-069: el comprador cancela su propio pedido mientras esté en
  // "Pendiente" o "Aceptado" (no más allá: una vez "En camino" el reparto
  // ya salió, confirmado con el usuario). A diferencia de rechazar()
  // (RF-024, acción del distribuidor), no exige un motivo: es la
  // propia decisión del comprador sobre su propio pedido, no tiene que
  // justificarse ante nadie (confirmado con el usuario). Libera el stock
  // reservado únicamente si venía de "aceptado" — si todavía estaba
  // "pendiente" nunca se reservó stock (solo aceptar() reserva, arriba).
  // Notifica al distribuidor: única notificación de este archivo en esa
  // dirección, por eso no usa notificarCambioEstado/mensajeCambioEstado
  // (ambos redactados para el sentido distribuidor → comprador).
  async cancelar() {
    if (this.estado !== 'pendiente' && this.estado !== 'aceptado') {
      throw Object.assign(new Error('Solo se pueden cancelar pedidos en estado Pendiente o Aceptado.'), { status: 409 })
    }

    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const estadoAnterior = this.estado

      await cliente.query(`UPDATE pedido SET estado = 'cancelado' WHERE id = $1`, [this.id])

      if (estadoAnterior === 'aceptado') {
        const items = await PedidoItem.listarPorPedido(this.id, cliente)
        for (const item of items) {
          await cliente.query(
            `UPDATE producto SET stock_reservado = stock_reservado - $1 WHERE id = $2`,
            [item.cantidad, item.productoId]
          )
        }
      }

      // Si el pedido ya estaba en un plan de reparto "sin_empezar" (RF-043),
      // esa parada queda huérfana al cancelar — se borra acá mismo, en la
      // misma transacción, para que el reparto no la arrastre.
      await cliente.query(
        `DELETE FROM parada_reparto
         WHERE pedido_id = $1
           AND plan_reparto_id IN (SELECT id FROM plan_reparto WHERE estado = 'sin_empezar')`,
        [this.id]
      )

      this.estado = 'cancelado'

      const resInfo = await cliente.query(
        `SELECT d.usuario_id AS "distribuidorUsuarioId", u.nombre_completo AS "nombreComprador"
         FROM distribuidor d
         JOIN usuario u ON u.id = $2
         WHERE d.id = $1`,
        [this.distribuidorId, this.compradorId]
      )
      const { distribuidorUsuarioId, nombreComprador } = resInfo.rows[0]
      await Notificacion.crear(
        distribuidorUsuarioId,
        'cambio_estado_pedido',
        `${nombreComprador} canceló su pedido #${this.id}.`,
        this.id,
        cliente
      )

      await cliente.query('COMMIT')
      return { id: this.id, estado: 'cancelado' }
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }
}

// RF-064/066/046: el módulo de reparto (PlanReparto) necesita redactar el
// mismo texto de notificación que ya usa Pedido para sus propias
// transiciones de estado, para que el comprador reciba el mismo mensaje
// sin importar si el cambio lo disparó Pedido directamente o una acción
// sobre el reparto que lo contiene.
Pedido.mensajeCambioEstado = mensajeCambioEstado

export default Pedido
