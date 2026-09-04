import Pedido from '../models/Pedido.js'
import Producto from '../models/Producto.js'
import PrecioVolumen from '../models/PrecioVolumen.js'

const LIMITE_RANKING_PRODUCTOS = 5

function calcularRangoPeriodo(periodo) {
  const ahora = new Date()
  const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

  if (periodo === 'dia') {
    const fin = new Date(inicioDia)
    fin.setDate(fin.getDate() + 1)
    return { inicio: inicioDia, fin }
  }

  if (periodo === 'semana') {
    const diaSemana = inicioDia.getDay() // 0 = domingo … 6 = sábado
    const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1
    const inicio = new Date(inicioDia)
    inicio.setDate(inicio.getDate() - diasDesdeElLunes)
    const fin = new Date(inicio)
    fin.setDate(fin.getDate() + 7)
    return { inicio, fin }
  }

  const inicio = new Date(inicioDia.getFullYear(), inicioDia.getMonth(), 1)
  const fin = new Date(inicioDia.getFullYear(), inicioDia.getMonth() + 1, 1)
  return { inicio, fin }
}

// RF-039/RF-041: KPIs de rendimiento (total facturado, pedidos entregados) y
// ranking de productos más/menos vendidos, del período elegido.
async function generarReporteRendimiento(usuarioDistribuidorId, periodo) {
  const { inicio, fin } = calcularRangoPeriodo(periodo)

  const { totalFacturado, cantidadPedidosEntregados } =
    await Pedido.calcularTotalesEntregados(usuarioDistribuidorId, inicio, fin)

  const ranking = await Producto.listarVendidosPorDistribuidor(usuarioDistribuidorId, inicio, fin)

  return {
    periodo,
    totalFacturado,
    cantidadPedidosEntregados,
    productosMasVendidos: ranking.slice(0, LIMITE_RANKING_PRODUCTOS),
    productosMenosVendidos: [...ranking].reverse().slice(0, LIMITE_RANKING_PRODUCTOS),
  }
}

// RF-040: rentabilidad por tramo de precio por volumen.
async function calcularRentabilidadPorPrecioVolumen(usuarioDistribuidorId) {
  return PrecioVolumen.listarConRentabilidadPorDistribuidor(usuarioDistribuidorId)
}

export { generarReporteRendimiento, calcularRentabilidadPorPrecioVolumen }
