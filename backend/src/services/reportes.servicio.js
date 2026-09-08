import pool from '../config/db.js'
import Pedido from '../models/Pedido.js'
import Producto from '../models/Producto.js'
import PrecioVolumen from '../models/PrecioVolumen.js'
import Distribuidor from '../models/Distribuidor.js'

const LIMITE_RANKING_PRODUCTOS = 5

// RF-037: "día / semana / mes actual" es en hora de Uruguay. El rango se
// calcula en Postgres con `now() AT TIME ZONE 'America/Montevideo'` para
// que NO dependa de la zona horaria del proceso Node (antes usaba
// `new Date()` local: si el server no está en esa zona, los cortes se
// corren horas). `fecha_entregado` es TIMESTAMP sin zona y guarda el
// wall-clock de Uruguay (se escribe con NOW() en la sesión de la base,
// configurada en America/Montevideo), así que se compara contra strings
// naive del mismo criterio. `date_trunc('week', ...)` arranca el lunes
// (ISO), igual que la lógica anterior.
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

// RF-035/RF-037: KPIs de rendimiento (total facturado, pedidos entregados) y
// ranking de productos más/menos vendidos, del período elegido.
// RNF-005: sin perfil de distribuidor no hay reportes que calcular — antes
// devolvía todo en cero a cualquier usuario autenticado.
async function generarReporteRendimiento(usuarioDistribuidorId, periodo) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioDistribuidorId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }

  const { inicio, fin } = await calcularRangoPeriodo(periodo)

  const { totalFacturado, cantidadPedidosEntregados } =
    await Pedido.calcularTotalesEntregados(usuarioDistribuidorId, inicio, fin)

  const ranking = await Producto.listarVendidosPorDistribuidor(usuarioDistribuidorId, inicio, fin)

  // RF-035: "más vendidos" y "menos vendidos" son listas distintas. Sin
  // este filtro, con pocos productos vendidos (<= 2 * LIMITE) los mismos
  // productos aparecían en ambas listas (uno como "el que más vendés" y
  // "el que menos vendés" a la vez). "Menos vendidos" excluye lo que ya
  // está en "más vendidos": queda vacía si hay <= LIMITE productos.
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

// RF-036: rentabilidad por tramo de precio por volumen.
async function calcularRentabilidadPorPrecioVolumen(usuarioDistribuidorId) {
  const distribuidor = await Distribuidor.obtenerPorUsuarioId(usuarioDistribuidorId)
  if (!distribuidor) {
    throw Object.assign(new Error('No tenés un perfil de distribuidor configurado.'), { status: 404 })
  }
  return PrecioVolumen.listarConRentabilidadPorDistribuidor(usuarioDistribuidorId)
}

export { generarReporteRendimiento, calcularRentabilidadPorPrecioVolumen }
