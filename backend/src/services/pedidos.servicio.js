const pool = require('../config/db')

async function confirmarPedido(compradorId, direccionEntrega, latitud, longitud, items) {
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')

    const pedidosCreados = []

    // Agrupar items por distribuidor
    const porDistribuidor = {}
    for (const item of items) {
      const key = item.distribuidorId
      if (!porDistribuidor[key]) porDistribuidor[key] = []
      porDistribuidor[key].push(item)
    }

    for (const [distribuidorId, itemsGrupo] of Object.entries(porDistribuidor)) {
      // Crear el pedido para este distribuidor
      const resPedido = await cliente.query(
        `INSERT INTO pedido (comprador_id, distribuidor_id, direccion_entrega, latitud, longitud, estado)
         VALUES ($1, $2, $3, $4, $5, 'pendiente')
         RETURNING id`,
        [compradorId, Number(distribuidorId), direccionEntrega, latitud ?? null, longitud ?? null]
      )
      const pedidoId = resPedido.rows[0].id

      for (const item of itemsGrupo) {
        // Buscar el precio_volumen aplicable según la cantidad (el mayor rango que no supere la cantidad)
        const resPrecio = await cliente.query(
          `SELECT id, precio_venta AS "precioVenta"
           FROM precio_volumen
           WHERE producto_id = $1 AND cantidad_minima <= $2
           ORDER BY cantidad_minima DESC
           LIMIT 1`,
          [item.productoId, item.cantidad]
        )

        if (resPrecio.rows.length === 0) {
          throw Object.assign(new Error('No hay un precio por volumen disponible para uno de los productos.'), { status: 400 })
        }

        const { id: precioVolumenId, precioVenta } = resPrecio.rows[0]

        await cliente.query(
          `INSERT INTO pedido_item (pedido_id, producto_id, precio_volumen_id, cantidad, precio_venta_congelado)
           VALUES ($1, $2, $3, $4, $5)`,
          [pedidoId, item.productoId, precioVolumenId, item.cantidad, precioVenta]
        )
      }

      // Obtener usuario_id del distribuidor y nombre del comprador para la notificación
      const resInfo = await cliente.query(
        `SELECT d.usuario_id AS "distribuidorUsuarioId", u.nombre_completo AS "nombreComprador"
         FROM distribuidor d
         JOIN usuario u ON u.id = $2
         WHERE d.id = $1`,
        [Number(distribuidorId), compradorId]
      )
      const { distribuidorUsuarioId, nombreComprador } = resInfo.rows[0]

      await cliente.query(
        `INSERT INTO notificacion (usuario_id, pedido_id, tipo, mensaje)
         VALUES ($1, $2, 'pedido_entrante', $3)`,
        [distribuidorUsuarioId, pedidoId, `Nuevo pedido #${pedidoId} de ${nombreComprador}.`]
      )

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

async function obtenerHistorialDistribuidor(usuarioId) {
  const res = await pool.query(
    `SELECT
       p.id,
       p.estado,
       p.fecha_creacion AS "fechaCreacion",
       u.nombre_completo AS "nombreComprador",
       u.telefono AS "telefonoComprador",
       COALESCE(SUM(pi.cantidad * pi.precio_venta_congelado), 0) AS total
     FROM pedido p
     JOIN distribuidor d ON d.id = p.distribuidor_id
     JOIN usuario u ON u.id = p.comprador_id
     LEFT JOIN pedido_item pi ON pi.pedido_id = p.id
     WHERE d.usuario_id = $1
     GROUP BY p.id, u.nombre_completo, u.telefono
     ORDER BY p.fecha_creacion DESC`,
    [usuarioId]
  )
  return res.rows
}

async function obtenerHistorialComprador(compradorId) {
  const res = await pool.query(
    `SELECT
       p.id,
       p.estado,
       p.fecha_creacion AS "fechaCreacion",
       d.nombre_comercial AS "nombreDistribuidor",
       COALESCE(SUM(pi.cantidad * pi.precio_venta_congelado), 0) AS total
     FROM pedido p
     JOIN distribuidor d ON d.id = p.distribuidor_id
     LEFT JOIN pedido_item pi ON pi.pedido_id = p.id
     WHERE p.comprador_id = $1
     GROUP BY p.id, d.nombre_comercial
     ORDER BY p.fecha_creacion DESC`,
    [compradorId]
  )
  return res.rows
}

async function obtenerPedidosActivos(usuarioId) {
  const res = await pool.query(
    `SELECT
       p.id,
       p.estado,
       p.fecha_creacion AS "fechaCreacion",
       u.nombre_completo AS "nombreComprador",
       u.telefono AS "telefonoComprador",
       COALESCE(SUM(pi.cantidad * pi.precio_venta_congelado), 0) AS total,
       COALESCE(
         json_agg(
           json_build_object(
             'productoId', pr.id,
             'nombreProducto', pr.nombre,
             'cantidad', pi.cantidad,
             'stockDisponible', (pr.stock_total - pr.stock_reservado),
             'tipoProducto', pr.tipo_producto,
             'metricaVisualizacion', pr.metrica_visualizacion
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

async function aceptarPedido(pedidoId, distribuidorUsuarioId) {
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')

    const resPedido = await cliente.query(
      `SELECT p.id, p.estado, u.telefono AS "telefonoComprador", u.nombre_completo AS "nombreComprador"
       FROM pedido p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       JOIN usuario u ON u.id = p.comprador_id
       WHERE p.id = $1 AND d.usuario_id = $2`,
      [pedidoId, distribuidorUsuarioId]
    )

    if (resPedido.rows.length === 0) {
      throw Object.assign(new Error('Pedido no encontrado.'), { status: 404 })
    }

    const pedido = resPedido.rows[0]
    if (pedido.estado !== 'pendiente') {
      throw Object.assign(new Error('Solo se pueden aceptar pedidos en estado Pendiente.'), { status: 409 })
    }

    const resItems = await cliente.query(
      `SELECT pi.producto_id AS "productoId", pi.cantidad,
              pi.precio_venta_congelado AS "precioVentaCongelado",
              pr.nombre AS "nombreProducto",
              pr.stock_total AS "stockTotal", pr.stock_reservado AS "stockReservado",
              pr.tipo_producto AS "tipoProducto", pr.metrica_visualizacion AS "metricaVisualizacion"
       FROM pedido_item pi
       JOIN producto pr ON pr.id = pi.producto_id
       WHERE pi.pedido_id = $1`,
      [pedidoId]
    )

    for (const item of resItems.rows) {
      if ((item.stockTotal - item.stockReservado) < item.cantidad) {
        throw Object.assign(
          new Error('No hay stock suficiente para aceptar este pedido. Revisá el inventario antes de continuar.'),
          { status: 409 }
        )
      }
    }

    await cliente.query(`UPDATE pedido SET estado = 'aceptado' WHERE id = $1`, [pedidoId])

    for (const item of resItems.rows) {
      await cliente.query(
        `UPDATE producto SET stock_reservado = stock_reservado + $1 WHERE id = $2`,
        [item.cantidad, item.productoId]
      )
    }

    const lineasProductos = resItems.rows.map(item => {
      let sufijo = 'u.'
      if (item.tipoProducto === 'fraccionable') {
        if (item.metricaVisualizacion === 'kilogramos') sufijo = 'kg'
        else if (item.metricaVisualizacion === 'litros') sufijo = 'L'
        else if (item.metricaVisualizacion === 'metros') sufijo = 'm'
      }
      return `- ${item.nombreProducto} × ${Number(item.cantidad)} ${sufijo}`
    }).join('\n')

    const total = resItems.rows.reduce((acc, item) => acc + Number(item.cantidad) * Number(item.precioVentaCongelado), 0)
    const mensaje = `Hola ${pedido.nombreComprador}, tu pedido #${pedidoId} fue aceptado.\n\nDetalle:\n${lineasProductos}\n\nTotal: $${total.toLocaleString('es-AR')}\n\nGracias por tu compra.`
    const telefono = pedido.telefonoComprador.replace(/^\+/, '')
    const deepLink = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`

    await cliente.query('COMMIT')
    return { deepLink }
  } catch (error) {
    await cliente.query('ROLLBACK')
    throw error
  } finally {
    cliente.release()
  }
}

module.exports = { confirmarPedido, obtenerHistorialDistribuidor, obtenerHistorialComprador, obtenerPedidosActivos, aceptarPedido }
