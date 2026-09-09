import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import './Reportes.css'

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
    <PanelDistribuidor tituloMobile="Reportes" activo="/reportes">
      <div className="reportes-subnav">
        <span className="reportes-subnav-item" onClick={() => navigate('/reportes')}>Rendimiento</span>
        <span className="reportes-subnav-item activo" onClick={() => navigate('/reportes/rentabilidad')}>Rentabilidad</span>
      </div>

      <div className="panel-seccion-header panel-seccion-header--sub">
        <div>
          <h1 className="panel-h1">Rentabilidad por precio por volumen</h1>
          <p className="panel-subtitulo">Comparación entre precio de venta y precio de costo por tramo.</p>
        </div>
      </div>

      {mensaje && <p className="reportes-vacio">{mensaje}</p>}
      {cargando && !mensaje && <p className="reportes-vacio">Cargando...</p>}

      {!cargando && !mensaje && lista.length === 0 && (
        <p className="reportes-vacio">Todavía no tenés precios por volumen registrados.</p>
      )}

      {!cargando && !mensaje && lista.length > 0 && (
        <div className="reportes-rentabilidad-wrapper">
          <div className="reportes-rentabilidad-header">
            <div>Producto</div>
            <div>Cant. mín.</div>
            <div>Precio venta</div>
            <div>Precio costo</div>
            <div>Diferencia $</div>
            <div>Diferencia %</div>
          </div>
          {lista.map(r => (
            <div className="reportes-rentabilidad-fila" key={r.precioVolumenId}>
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
            </div>
          ))}
        </div>
      )}
    </PanelDistribuidor>
  )
}

export default Rentabilidad
