import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import TablaHeader from '../../components/ui/TablaHeader'
import TablaFila from '../../components/ui/TablaFila'
import Kpi from '../../components/ui/Kpi'
import TabRow from '../../components/ui/TabRow'
import Esqueleto from '../../components/ui/Esqueleto'
import EsqueletoFilas from '../../components/ui/EsqueletoFilas'
import EstadoLista from '../../components/ui/EstadoLista'
import './Reportes.css'

const COLUMNAS_RANKING = ['Producto', 'Unidades']
const GRID_RANKING = { '--tabla-cols': '1fr 100px' }

const PERIODOS = [
  { valor: 'dia', etiqueta: 'Día' },
  { valor: 'semana', etiqueta: 'Semana' },
  { valor: 'mes', etiqueta: 'Mes' },
]

const SUBNAV_REPORTES = [
  { valor: '/reportes', etiqueta: 'Rendimiento' },
  { valor: '/reportes/rentabilidad', etiqueta: 'Rentabilidad' },
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

  useEffect(() => {
    setCargando(true)
    setMensaje('')
    api.get('/api/reportes/rendimiento', { params: { periodo } })
      .then(res => setReporte(res.data))
      .catch(err => {
        setMensaje(mensajeDeError(err))
      })
      .finally(() => setCargando(false))
  }, [periodo])

  const sinPedidos = reporte && reporte.cantidadPedidosEntregados === 0

  return (
    <PanelDistribuidor activo="/reportes">
      <TabRow tabs={SUBNAV_REPORTES} activo="/reportes" onCambiar={navigate} className="reportes-subnav" />

      <div className="reportes-encabezado">
        <div className="panel-seccion-header panel-seccion-header--sub">
          <div>
            <h1 className="panel-h1">Dashboard de rendimiento</h1>
            <p className="panel-subtitulo">Resumen del período seleccionado.</p>
          </div>
        </div>
        <TabRow tabs={PERIODOS} activo={periodo} onCambiar={setPeriodo} className="reportes-periodo-tabs" />
      </div>

      {mensaje && <EstadoLista variante="error">{mensaje}</EstadoLista>}

      {cargando && !mensaje && (
        <>
          <div className="kpi-row">
            <div className="kpi col gap-s"><Esqueleto width="55%" height={13} /><Esqueleto width="45%" height={28} /></div>
            <div className="kpi col gap-s"><Esqueleto width="55%" height={13} /><Esqueleto width="45%" height={28} /></div>
          </div>
          <div className="reportes-tablas">
            <div className="reportes-tabla-card" style={GRID_RANKING}>
              <div className="reportes-tabla-titulo">Productos más vendidos</div>
              <TablaHeader columnas={COLUMNAS_RANKING} className="reportes-tabla-header" />
              <EsqueletoFilas columnas={COLUMNAS_RANKING.length} filas={3} />
            </div>
            <div className="reportes-tabla-card" style={GRID_RANKING}>
              <div className="reportes-tabla-titulo">Productos menos vendidos</div>
              <TablaHeader columnas={COLUMNAS_RANKING} className="reportes-tabla-header" />
              <EsqueletoFilas columnas={COLUMNAS_RANKING.length} filas={3} />
            </div>
          </div>
        </>
      )}

      {!cargando && !mensaje && reporte && (
        <>
          <div className="kpi-row">
            <Kpi etiqueta="Total facturado" valor={formatearPesos(reporte.totalFacturado)} />
            <Kpi etiqueta="Pedidos entregados" valor={reporte.cantidadPedidosEntregados} />
          </div>

          {sinPedidos ? (
            <EstadoLista>No hay pedidos completados en el período seleccionado.</EstadoLista>
          ) : (
            <div className="reportes-tablas">
              <div className="reportes-tabla-card" style={GRID_RANKING}>
                <div className="reportes-tabla-titulo">Productos más vendidos</div>
                <TablaHeader columnas={COLUMNAS_RANKING} className="reportes-tabla-header" />
                {reporte.productosMasVendidos.map(p => (
                  <TablaFila key={p.id} className="reportes-tabla-fila">
                    <div>{p.nombre}</div>
                    <div>{p.unidadesVendidas}</div>
                  </TablaFila>
                ))}
              </div>
              <div className="reportes-tabla-card" style={GRID_RANKING}>
                <div className="reportes-tabla-titulo">Productos menos vendidos</div>
                {reporte.productosMenosVendidos.length === 0 ? (
                  <div className="reportes-tabla-nota">
                    Todos los productos vendidos en el período ya figuran en más vendidos.
                  </div>
                ) : (
                  <>
                    <TablaHeader columnas={COLUMNAS_RANKING} className="reportes-tabla-header" />
                    {reporte.productosMenosVendidos.map(p => (
                      <TablaFila key={p.id} className="reportes-tabla-fila">
                        <div>{p.nombre}</div>
                        <div>{p.unidadesVendidas}</div>
                      </TablaFila>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </PanelDistribuidor>
  )
}

export default Reportes
