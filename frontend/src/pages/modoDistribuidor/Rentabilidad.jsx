import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import Tabla from '../../components/ui/Tabla'
import TablaHeader from '../../components/ui/TablaHeader'
import TablaFila from '../../components/ui/TablaFila'
import TabRow from '../../components/ui/TabRow'
import EsqueletoFilas from '../../components/ui/EsqueletoFilas'
import EstadoLista from '../../components/ui/EstadoLista'
import './Reportes.css'

const COLUMNAS = ['Producto', 'Cant. mín.', 'Precio venta', 'Precio costo', 'Diferencia $', 'Diferencia %']
const GRID = '200px 100px 130px 130px 120px 120px'
const SUBNAV_REPORTES = [
  { valor: '/reportes', etiqueta: 'Rendimiento' },
  { valor: '/reportes/rentabilidad', etiqueta: 'Rentabilidad' },
]

function formatearPesos(valor) {
  return `$${Number(valor).toLocaleString('es-AR')}`
}

function Rentabilidad() {
  const navigate = useNavigate()

  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    api.get('/api/reportes/rentabilidad')
      .then(res => setLista(res.data))
      .catch(err => {
        setMensaje(mensajeDeError(err))
      })
      .finally(() => setCargando(false))
  }, [])

  return (
    <PanelDistribuidor activo="/reportes">
      <TabRow tabs={SUBNAV_REPORTES} activo="/reportes/rentabilidad" onCambiar={navigate} className="reportes-subnav" />

      <div className="panel-seccion-header panel-seccion-header--sub">
        <div>
          <h1 className="panel-h1">Rentabilidad por precio por volumen</h1>
          <p className="panel-subtitulo">Comparación entre precio de venta y precio de costo por tramo.</p>
        </div>
      </div>

      {mensaje && <EstadoLista variante="error">{mensaje}</EstadoLista>}

      {cargando && !mensaje && (
        <Tabla grid={GRID} className="reportes-rentabilidad-wrapper">
          <TablaHeader columnas={COLUMNAS} className="reportes-rentabilidad-header" />
          <EsqueletoFilas columnas={COLUMNAS.length} />
        </Tabla>
      )}

      {!cargando && !mensaje && lista.length === 0 && (
        <EstadoLista>Todavía no tenés precios por volumen registrados.</EstadoLista>
      )}

      {!cargando && !mensaje && lista.length > 0 && (
        <Tabla grid={GRID} className="reportes-rentabilidad-wrapper">
          <TablaHeader columnas={COLUMNAS} className="reportes-rentabilidad-header" />
          {lista.map(r => (
            <TablaFila key={r.precioVolumenId} className="reportes-rentabilidad-fila">
              <div>{r.productoNombre}</div>
              <div>{r.cantidadMinima} u.</div>
              <div>{formatearPesos(r.precioVenta)}</div>
              {r.tienePrecioCostoRegistrado ? (
                <>
                  <div>{formatearPesos(r.precioCosto)}</div>
                  <div>{formatearPesos(r.diferenciaPesos)}</div>
                  <div>{r.diferenciaPorcentaje != null ? `${r.diferenciaPorcentaje.toFixed(1)}%` : '—'}</div>
                </>
              ) : (
                <>
                  <div className="reportes-sin-costo">— Sin precio de costo</div>
                  <div>—</div>
                  <div>—</div>
                </>
              )}
            </TablaFila>
          ))}
        </Tabla>
      )}
    </PanelDistribuidor>
  )
}

export default Rentabilidad
