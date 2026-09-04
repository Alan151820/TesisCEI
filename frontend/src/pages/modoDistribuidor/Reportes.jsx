import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import './Reportes.css'

// RF-041: períodos disponibles. 'mes' es el default.
const PERIODOS = [
  { valor: 'dia', label: 'Día' },
  { valor: 'semana', label: 'Semana' },
  { valor: 'mes', label: 'Mes' },
]

function formatearPesos(valor) {
  return `$${Number(valor).toLocaleString('es-AR')}`
}

function Reportes() {
  const navigate = useNavigate()

  const [periodo, setPeriodo] = useState('mes')
  const [reporte, setReporte] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  useEffect(() => {
    setCargando(true)
    setMensaje('')
    api.get('/api/reportes/rendimiento', { params: { periodo } })
      .then(res => setReporte(res.data))
      .catch(err => {
        setMensaje(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
      })
      .finally(() => setCargando(false))
  }, [periodo])

  const sinPedidos = reporte && reporte.cantidadPedidosEntregados === 0

  return (
    <PanelDistribuidor tituloMobile="Reportes" activo="/reportes">
      <div className="reportes-subnav">
        <span className="reportes-subnav-item activo" onClick={() => navigate('/reportes')}>Rendimiento</span>
        <span className="reportes-subnav-item" onClick={() => navigate('/reportes/rentabilidad')}>Rentabilidad</span>
      </div>

      <div className="panel-seccion-header">
        <div>
          <h1 className="panel-h1">Dashboard de rendimiento</h1>
          <p className="panel-subtitulo">Resumen del período seleccionado.</p>
        </div>
        <div className="reportes-periodo-tabs">
          {PERIODOS.map(p => (
            <div
              key={p.valor}
              className={`reportes-periodo-tab${periodo === p.valor ? ' activo' : ''}`}
              onClick={() => setPeriodo(p.valor)}
            >
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {mensaje && <p className="reportes-vacio">{mensaje}</p>}

      {cargando && !mensaje && <p className="reportes-vacio">Cargando...</p>}

      {!cargando && !mensaje && reporte && (
        <>
          <div className="reportes-kpis">
            <div className="reportes-kpi-card">
              <div className="reportes-kpi-label">Total facturado</div>
              <div className="reportes-kpi-valor">{formatearPesos(reporte.totalFacturado)}</div>
            </div>
            <div className="reportes-kpi-card">
              <div className="reportes-kpi-label">Pedidos entregados</div>
              <div className="reportes-kpi-valor">{reporte.cantidadPedidosEntregados}</div>
            </div>
          </div>

          {sinPedidos ? (
            <p className="reportes-vacio">No hay pedidos completados en el período seleccionado.</p>
          ) : (
            <div className="reportes-tablas">
              <div className="reportes-tabla-card">
                <div className="reportes-tabla-titulo">Productos más vendidos</div>
                <div className="reportes-tabla-header">
                  <div>Producto</div>
                  <div>Unidades</div>
                </div>
                {reporte.productosMasVendidos.map(p => (
                  <div className="reportes-tabla-fila" key={p.id}>
                    <div>{p.nombre}</div>
                    <div>{p.unidadesVendidas}</div>
                  </div>
                ))}
              </div>
              <div className="reportes-tabla-card">
                <div className="reportes-tabla-titulo">Productos menos vendidos</div>
                <div className="reportes-tabla-header">
                  <div>Producto</div>
                  <div>Unidades</div>
                </div>
                {reporte.productosMenosVendidos.map(p => (
                  <div className="reportes-tabla-fila" key={p.id}>
                    <div>{p.nombre}</div>
                    <div>{p.unidadesVendidas}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PanelDistribuidor>
  )
}

export default Reportes
