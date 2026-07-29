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

module.exports = { confirmarPedido, obtenerHistorialDistribuidor, obtenerHistorialComprador }
