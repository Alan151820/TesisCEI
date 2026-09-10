import pool from '../config/db.js'
import Pedido from '../models/Pedido.js'
import Producto from '../models/Producto.js'
import PrecioVolumen from '../models/PrecioVolumen.js'
import Distribuidor from '../models/Distribuidor.js'

const LIMITE_RANKING_PRODUCTOS = 5

async function calcularRangoPeriodo(periodo) {
  const unidad = periodo === 'dia' ? 'day' : periodo === 'semana' ? 'week' : 'month'
  const paso = periodo === 'dia' ? '1 day' : periodo === 'semana' ? '1 week' : '1 month'
  const { rows } = await pool.query(
    `SELECT to_char(date_trunc($1, now() AT TIME ZONE 'America/Montevideo'), 'YYYY-MM-DD HH24:MI:SS') AS inicio,
            to_char(date_trunc($1, now() AT TIME ZONE 'America/Montevideo') + $2::interval, 'YYYY-MM-DD HH24:MI:SS') AS fin`,
    [unidad, paso]
  )
  return { inicio: rows[0].inicio, fin: rows[0].fin }
}

async function generarReporteRendimiento(usuarioDistribuidorId, periodo) {
  await Distribuidor.requerirPorUsuarioId(usuarioDistribuidorId)

  const { inicio, fin } = await calcularRangoPeriodo(periodo)

  const { totalFacturado, cantidadPedidosEntregados } =
    await Pedido.calcularTotalesEntregados(usuarioDistribuidorId, inicio, fin)

  const ranking = await Producto.listarVendidosPorDistribuidor(usuarioDistribuidorId, inicio, fin)

  const productosMasVendidos = ranking.slice(0, LIMITE_RANKING_PRODUCTOS)
  const idsMasVendidos = new Set(productosMasVendidos.map(p => p.id))
  const productosMenosVendidos = [...ranking]
    .reverse()
    .filter(p => !idsMasVendidos.has(p.id))
    .slice(0, LIMITE_RANKING_PRODUCTOS)

  return {
    periodo,
    totalFacturado,
    cantidadPedidosEntregados,
    productosMasVendidos,
    productosMenosVendidos,
  }
}

async function calcularRentabilidadPorPrecioVolumen(usuarioDistribuidorId) {
  await Distribuidor.requerirPorUsuarioId(usuarioDistribuidorId)
  return PrecioVolumen.listarConRentabilidadPorDistribuidor(usuarioDistribuidorId)
}

export { generarReporteRendimiento, calcularRentabilidadPorPrecioVolumen }
