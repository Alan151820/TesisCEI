import * as reportesServicio from '../services/reportes.servicio.js'

// RF-041: períodos válidos. 'mes' es el default si no llega ninguno.
const PERIODOS_VALIDOS = ['dia', 'semana', 'mes']

async function obtenerRendimiento(req, res, next) {
  const periodo = req.query.periodo || 'mes'
  if (!PERIODOS_VALIDOS.includes(periodo)) {
    return res.status(400).json({ error: 'El período seleccionado no es válido.' })
  }

  try {
    const reporte = await reportesServicio.generarReporteRendimiento(req.usuario.id, periodo)
    res.json(reporte)
  } catch (error) {
    next(error)
  }
}

async function obtenerRentabilidad(req, res, next) {
  try {
    const rentabilidad = await reportesServicio.calcularRentabilidadPorPrecioVolumen(req.usuario.id)
    res.json(rentabilidad)
  } catch (error) {
    next(error)
  }
}

export { obtenerRendimiento, obtenerRentabilidad }
