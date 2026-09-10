import pool from '../config/db.js'
import ParadaReparto from './ParadaReparto.js'
import Pedido from './Pedido.js'
import Notificacion from './Notificacion.js'

const RADIO_TIERRA_KM = 6371
const OSRM_TABLE_URL = 'https://router.project-osrm.org/table/v1/driving'
const OSRM_TIMEOUT_MS = 5000

function distanciaKm(lat1, lon1, lat2, lon2) {
  const radianes = grados => (grados * Math.PI) / 180
  const dLat = radianes(lat2 - lat1)
  const dLon = radianes(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radianes(lat1)) * Math.cos(radianes(lat2)) * Math.sin(dLon / 2) ** 2
  return RADIO_TIERRA_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function obtenerDistanciasReales(latitudPartida, longitudPartida, pedidosConCoordenadas) {
  if (pedidosConCoordenadas.length === 0) return new Map()

  const puntos = [
    `${longitudPartida},${latitudPartida}`,
    ...pedidosConCoordenadas.map(p => `${p.longitud},${p.latitud}`),
  ].join(';')

  try {
    const res = await fetch(
      `${OSRM_TABLE_URL}/${puntos}?sources=0&annotations=distance`,
      { signal: AbortSignal.timeout(OSRM_TIMEOUT_MS) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const fila = data.distances?.[0]
    if (data.code !== 'Ok' || !fila) return null

    const resultado = new Map()
    pedidosConCoordenadas.forEach((pedido, i) => {
      const metros = fila[i + 1]
      if (typeof metros === 'number') resultado.set(pedido.id, metros / 1000)
    })
    return resultado
  } catch {
    return null
  }
}

async function ordenarPorDistancia(pedidos, latitudPartida, longitudPartida) {
  const conCoordenadas = pedidos.filter(p => p.latitud != null && p.longitud != null)
  const distanciasReales = await obtenerDistanciasReales(latitudPartida, longitudPartida, conCoordenadas)

  const distanciaDe = (pedido) => {
    if (pedido.latitud == null || pedido.longitud == null) return Infinity
    const real = distanciasReales?.get(pedido.id)
    if (real != null) return real
    return distanciaKm(Number(latitudPartida), Number(longitudPartida), Number(pedido.latitud), Number(pedido.longitud))
  }

  return [...pedidos].sort((a, b) => distanciaDe(a) - distanciaDe(b))
}

class PlanReparto {
  constructor(data) {
    this.id = data.id
    this.distribuidorId = data.distribuidor_id
    this.estado = data.estado
    this.fechaCreacion = data.fecha_creacion
  }

  static async generarPlanCarga(distribuidorId, latitudPartida, longitudPartida, pedidos) {
    const ordenados = await ordenarPorDistancia(pedidos, latitudPartida, longitudPartida)

    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const resPlan = await cliente.query(
        `INSERT INTO plan_reparto (distribuidor_id, estado) VALUES ($1, 'sin_empezar') RETURNING *`,
        [distribuidorId]
      )
      const plan = new PlanReparto(resPlan.rows[0])

      const paradas = []
      for (let i = 0; i < ordenados.length; i++) {
        const resParada = await cliente.query(
          `INSERT INTO parada_reparto (plan_reparto_id, pedido_id, orden, estado_parada)
           VALUES ($1, $2, $3, 'pendiente') RETURNING *`,
          [plan.id, ordenados[i].id, i + 1]
        )
        paradas.push(new ParadaReparto(resParada.rows[0]))
      }

      await cliente.query('COMMIT')
      return { plan, paradas }
    } catch (error) {
      await cliente.query('ROLLBACK')
      if (error.code === '23505') {
        const err = new Error('Uno de los pedidos seleccionados ya forma parte de otro plan de reparto activo.')
        err.status = 409
        throw err
      }
      throw error
    } finally {
      cliente.release()
    }
  }

  static async listarPorDistribuidor(distribuidorId) {
    const res = await pool.query(
      `SELECT
         p.id, p.estado, p.fecha_creacion AS "fechaCreacion",
         COUNT(pa.id)::int AS "totalParadas",
         COUNT(pa.id) FILTER (WHERE pa.estado_parada != 'pendiente')::int AS "paradasResueltas"
       FROM plan_reparto p
       LEFT JOIN parada_reparto pa ON pa.plan_reparto_id = p.id
       WHERE p.distribuidor_id = $1
       GROUP BY p.id
       ORDER BY p.fecha_creacion DESC`,
      [distribuidorId]
    )
    return res.rows
  }

  static async obtenerDetalle(planId, distribuidorId) {
    const resPlan = await pool.query(
      `SELECT p.*, d.latitud AS deposito_latitud, d.longitud AS deposito_longitud
       FROM plan_reparto p
       JOIN distribuidor d ON d.id = p.distribuidor_id
       WHERE p.id = $1 AND p.distribuidor_id = $2`,
      [planId, distribuidorId]
    )
    if (resPlan.rows.length === 0) return null
    const plan = new PlanReparto(resPlan.rows[0])
    plan.depositoLatitud = resPlan.rows[0].deposito_latitud
    plan.depositoLongitud = resPlan.rows[0].deposito_longitud

    const resParadas = await pool.query(
      `SELECT
         pa.id, pa.orden, pa.estado_parada AS "estadoParada", pa.motivo,
         p.id AS "pedidoId", p.direccion_entrega AS "direccionEntrega",
         p.latitud, p.longitud,
         u.nombre_completo AS "nombreComprador", u.telefono AS "telefonoComprador",
         COALESCE(
           json_agg(
             json_build_object('nombreProducto', pr.nombre, 'cantidad', pi.cantidad, 'imagenUrl', pr.imagen_url)
             ORDER BY pi.id
           ) FILTER (WHERE pi.id IS NOT NULL),
           '[]'
         ) AS items
       FROM parada_reparto pa
       JOIN pedido p ON p.id = pa.pedido_id
       JOIN usuario u ON u.id = p.comprador_id
       LEFT JOIN pedido_item pi ON pi.pedido_id = p.id
       LEFT JOIN producto pr ON pr.id = pi.producto_id
       WHERE pa.plan_reparto_id = $1
       GROUP BY pa.id, p.id, u.id
       ORDER BY pa.orden`,
      [planId]
    )

    return { plan, paradas: resParadas.rows }
  }

  static async editarPedidos(planId, distribuidorId, pedidos, latitudPartida, longitudPartida, nombreDistribuidor) {
    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const resPlan = await cliente.query(
        `SELECT * FROM plan_reparto WHERE id = $1 AND distribuidor_id = $2 AND estado != 'finalizado' FOR UPDATE`,
        [planId, distribuidorId]
      )
      if (resPlan.rows.length === 0) {
        await cliente.query('ROLLBACK')
        return null
      }
      const plan = new PlanReparto(resPlan.rows[0])

      const resParadas = await cliente.query(
        `SELECT * FROM parada_reparto WHERE plan_reparto_id = $1`,
        [planId]
      )
      const paradasActuales = resParadas.rows.map(r => new ParadaReparto(r))
      const marcadas = paradasActuales.filter(p => p.estadoParada !== 'pendiente')
      const pendientesActuales = paradasActuales.filter(p => p.estadoParada === 'pendiente')

      const idsDeseados = new Set(pedidos.map(p => p.id))

      for (const parada of marcadas) {
        if (!idsDeseados.has(parada.pedidoId)) {
          const err = new Error('No se puede quitar una parada que ya fue marcada como Entregada, Omitida o Rechazada.')
          err.status = 409
          throw err
        }
      }

      const aQuitar = pendientesActuales.filter(p => !idsDeseados.has(p.pedidoId))
      for (const parada of aQuitar) {
        await cliente.query(`DELETE FROM parada_reparto WHERE id = $1`, [parada.id])
      }

      const idsExistentes = new Set(paradasActuales.map(p => p.pedidoId))
      const aAgregar = pedidos.filter(p => !idsExistentes.has(p.id))
      for (const pedido of aAgregar) {
        await cliente.query(
          `INSERT INTO parada_reparto (plan_reparto_id, pedido_id, orden, estado_parada)
           VALUES ($1, $2, 0, 'pendiente')`,
          [planId, pedido.id]
        )
        if (plan.estado === 'en_curso') {
          const resPedido = await cliente.query(
            `UPDATE pedido SET estado = 'en_camino' WHERE id = $1 RETURNING comprador_id AS "compradorId"`,
            [pedido.id]
          )
          await Notificacion.crear(
            resPedido.rows[0].compradorId, 'cambio_estado_pedido',
            Pedido.mensajeCambioEstado(nombreDistribuidor, 'en_camino'), pedido.id, cliente
          )
        }
      }

      const idsMarcados = new Set(marcadas.map(p => p.pedidoId))
      const pendientesFinales = pedidos.filter(p => !idsMarcados.has(p.id))
      const ordenados = await ordenarPorDistancia(pendientesFinales, latitudPartida, longitudPartida)
      for (let i = 0; i < ordenados.length; i++) {
        await cliente.query(
          `UPDATE parada_reparto SET orden = $1 WHERE plan_reparto_id = $2 AND pedido_id = $3`,
          [i + 1, planId, ordenados[i].id]
        )
      }

      await cliente.query('COMMIT')

      const resFinal = await cliente.query(
        `SELECT * FROM parada_reparto WHERE plan_reparto_id = $1 ORDER BY orden`,
        [planId]
      )
      return { plan, paradas: resFinal.rows.map(r => new ParadaReparto(r)) }
    } catch (error) {
      await cliente.query('ROLLBACK')
      if (error.code === '23505') {
        const err = new Error('Uno de los pedidos seleccionados ya forma parte de otro reparto.')
        err.status = 409
        throw err
      }
      throw error
    } finally {
      cliente.release()
    }
  }

  static async iniciar(planId, distribuidorId, nombreDistribuidor) {
    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const resPlan = await cliente.query(
        `SELECT * FROM plan_reparto WHERE id = $1 AND distribuidor_id = $2 AND estado = 'sin_empezar' FOR UPDATE`,
        [planId, distribuidorId]
      )
      if (resPlan.rows.length === 0) {
        await cliente.query('ROLLBACK')
        return null
      }

      await cliente.query(
        `DELETE FROM parada_reparto
         WHERE plan_reparto_id = $1
           AND pedido_id NOT IN (SELECT id FROM pedido WHERE estado = 'aceptado')`,
        [planId]
      )

      const resParadas = await cliente.query(
        `SELECT COUNT(*)::int AS cantidad FROM parada_reparto WHERE plan_reparto_id = $1`,
        [planId]
      )
      if (resParadas.rows[0].cantidad === 0) {
        await cliente.query('ROLLBACK')
        return 'sin_paradas'
      }

      const resPedidos = await cliente.query(
        `UPDATE pedido SET estado = 'en_camino'
         WHERE estado = 'aceptado'
           AND id IN (SELECT pedido_id FROM parada_reparto WHERE plan_reparto_id = $1)
         RETURNING id, comprador_id AS "compradorId"`,
        [planId]
      )
      for (const pedido of resPedidos.rows) {
        await Notificacion.crear(
          pedido.compradorId, 'cambio_estado_pedido',
          Pedido.mensajeCambioEstado(nombreDistribuidor, 'en_camino'), pedido.id, cliente
        )
      }

      const resPlanFinal = await cliente.query(
        `UPDATE plan_reparto SET estado = 'en_curso' WHERE id = $1 RETURNING *`,
        [planId]
      )

      await cliente.query('COMMIT')
      return new PlanReparto(resPlanFinal.rows[0])
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }

  static async cerrarEnBloque(planId, distribuidorId, motivo) {
    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const resPlan = await cliente.query(
        `SELECT * FROM plan_reparto WHERE id = $1 AND distribuidor_id = $2 AND estado = 'en_curso' FOR UPDATE`,
        [planId, distribuidorId]
      )
      if (resPlan.rows.length === 0) {
        await cliente.query('ROLLBACK')
        return null
      }

      const resPendientes = await cliente.query(
        `UPDATE parada_reparto SET estado_parada = 'omitido', motivo = $1
         WHERE plan_reparto_id = $2 AND estado_parada = 'pendiente'
         RETURNING pedido_id`,
        [motivo, planId]
      )
      if (resPendientes.rows.length === 0) {
        await cliente.query('ROLLBACK')
        return null
      }

      await cliente.query(
        `UPDATE pedido SET estado = 'aceptado' WHERE id = ANY($1) AND estado = 'en_camino'`,
        [resPendientes.rows.map(r => r.pedido_id)]
      )

      const resPlanFinal = await cliente.query(
        `UPDATE plan_reparto SET estado = 'finalizado' WHERE id = $1 RETURNING *`,
        [planId]
      )

      await cliente.query('COMMIT')
      return new PlanReparto(resPlanFinal.rows[0])
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }

  static async marcarParada(planId, distribuidorId, paradaId, accion, motivo, nombreDistribuidor) {
    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const resPlan = await cliente.query(
        `SELECT * FROM plan_reparto WHERE id = $1 AND distribuidor_id = $2 AND estado = 'en_curso' FOR UPDATE`,
        [planId, distribuidorId]
      )
      if (resPlan.rows.length === 0) {
        await cliente.query('ROLLBACK')
        return 'plan_no_valido'
      }

      const resParada = await cliente.query(
        `SELECT * FROM parada_reparto WHERE id = $1 AND plan_reparto_id = $2 AND estado_parada = 'pendiente' FOR UPDATE`,
        [paradaId, planId]
      )
      if (resParada.rows.length === 0) {
        await cliente.query('ROLLBACK')
        return 'parada_no_valida'
      }
      const parada = resParada.rows[0]

      const resPedido = await cliente.query(
        `SELECT id, comprador_id AS "compradorId" FROM pedido WHERE id = $1 AND estado = 'en_camino' FOR UPDATE`,
        [parada.pedido_id]
      )
      if (resPedido.rows.length === 0) {
        await cliente.query('ROLLBACK')
        return 'pedido_no_valido'
      }
      const pedido = resPedido.rows[0]

      if (accion === 'entregado' || accion === 'rechazado') {
        const items = (await cliente.query(
          `SELECT producto_id AS "productoId", cantidad FROM pedido_item WHERE pedido_id = $1`,
          [pedido.id]
        )).rows

        if (accion === 'entregado') {
          await cliente.query(
            `UPDATE pedido SET estado = 'entregado', fecha_entregado = NOW() WHERE id = $1`,
            [pedido.id]
          )
          for (const item of items) {
            await cliente.query(
              `UPDATE producto SET stock_total = stock_total - $1, stock_reservado = stock_reservado - $1 WHERE id = $2`,
              [item.cantidad, item.productoId]
            )
          }
        } else {
          await cliente.query(
            `UPDATE pedido SET estado = 'rechazado', motivo_rechazo = $1 WHERE id = $2`,
            [motivo, pedido.id]
          )
          for (const item of items) {
            await cliente.query(
              `UPDATE producto SET stock_reservado = stock_reservado - $1 WHERE id = $2`,
              [item.cantidad, item.productoId]
            )
          }
        }

        await Notificacion.crear(
          pedido.compradorId, 'cambio_estado_pedido',
          Pedido.mensajeCambioEstado(nombreDistribuidor, accion, motivo), pedido.id, cliente
        )
      } else if (accion === 'omitido') {
        await cliente.query(`UPDATE pedido SET estado = 'aceptado' WHERE id = $1`, [pedido.id])
      }

      await cliente.query(
        `UPDATE parada_reparto SET estado_parada = $1, motivo = $2 WHERE id = $3`,
        [accion, motivo, paradaId]
      )

      const resPendientes = await cliente.query(
        `SELECT COUNT(*)::int AS cantidad FROM parada_reparto WHERE plan_reparto_id = $1 AND estado_parada = 'pendiente'`,
        [planId]
      )
      if (resPendientes.rows[0].cantidad === 0) {
        await cliente.query(`UPDATE plan_reparto SET estado = 'finalizado' WHERE id = $1`, [planId])
      }

      await cliente.query('COMMIT')
      return 'marcado'
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }

  static async actualizarUbicacion(planId, distribuidorId, latitud, longitud) {
    const res = await pool.query(
      `UPDATE plan_reparto
       SET ultima_latitud = $1, ultima_longitud = $2, ultima_ubicacion_fecha = NOW()
       WHERE id = $3 AND distribuidor_id = $4 AND estado = 'en_curso'
       RETURNING id`,
      [latitud, longitud, planId, distribuidorId]
    )
    return res.rows.length > 0
  }

  static async eliminar(planId, distribuidorId) {
    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      const resPlan = await cliente.query(
        `SELECT estado FROM plan_reparto WHERE id = $1 AND distribuidor_id = $2 FOR UPDATE`,
        [planId, distribuidorId]
      )
      if (resPlan.rows.length === 0) {
        await cliente.query('ROLLBACK')
        return 'no_encontrado'
      }
      if (resPlan.rows[0].estado !== 'sin_empezar') {
        await cliente.query('ROLLBACK')
        return 'no_es_sin_empezar'
      }

      await cliente.query(`DELETE FROM parada_reparto WHERE plan_reparto_id = $1`, [planId])
      await cliente.query(`DELETE FROM plan_reparto WHERE id = $1`, [planId])

      await cliente.query('COMMIT')
      return 'eliminado'
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }
}

export default PlanReparto
