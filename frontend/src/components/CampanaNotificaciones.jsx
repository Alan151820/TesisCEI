import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import './CampanaNotificaciones.css'

// Campana de notificaciones reutilizable (comprador y distribuidor).
// rutaDestino: a dónde navegar al tocar una notificación que refiere a un pedido, si no hay rutaDetalle.
// rutaDetalle: prefijo de la vista de detalle de ese pedido (ej. '/pedido'); si se recibe, se navega a `${rutaDetalle}/${pedidoId}`.
function CampanaNotificaciones({ rutaDestino = '/misPedidos', rutaDetalle }) {
  const navigate = useNavigate()
  const [notificaciones, setNotificaciones] = useState([])
  const [abierta, setAbierta] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    api.get('/api/notificaciones')
      .then(res => setNotificaciones(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!abierta) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierta(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [abierta])

  const noLeidas = notificaciones.filter(n => !n.leida).length

  const formatFecha = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-UY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const handleClickNotif = async (notif) => {
    if (!notif.leida) {
      try {
        await api.patch(`/api/notificaciones/${notif.id}/leer`)
        setNotificaciones(prev => prev.map(n => n.id === notif.id ? { ...n, leida: true } : n))
      } catch {}
    }
    setAbierta(false)
    if (notif.pedidoId) navigate(rutaDetalle ? `${rutaDetalle}/${notif.pedidoId}` : rutaDestino)
  }

  return (
    <div className="campana" ref={ref}>
      <button className="campana-btn" onClick={() => setAbierta(v => !v)} aria-label="Notificaciones">
        🔔
        {noLeidas > 0 && <span className="campana-badge">{noLeidas}</span>}
      </button>
      {abierta && (
        <div className="campana-dropdown">
          {notificaciones.length === 0
            ? <div className="campana-vacio">No tenés notificaciones.</div>
            : notificaciones.map(n => (
              <button
                key={n.id}
                type="button"
                className={`campana-item${!n.leida ? ' no-leida' : ''}`}
                onClick={() => handleClickNotif(n)}
              >
                {!n.leida && <span className="campana-punto" />}
                <span className="campana-cuerpo">
                  {n.nombreProducto ? (
                    <span className="campana-pedido-fila">
                      {n.imagenUrl
                        ? <img src={`http://localhost:3000${n.imagenUrl}`} alt="" className="campana-pedido-imagen" />
                        : <span className="campana-pedido-imagen-placeholder" />
                      }
                      <span className="campana-pedido-texto">
                        <span className="campana-mensaje">
                          {n.motivoRechazo ? n.mensaje.split('Motivo: ')[0] : n.mensaje}
                          {n.motivoRechazo && (
                            <span className="campana-motivo">Motivo: {n.motivoRechazo}</span>
                          )}
                        </span>
                        <span className="campana-pedido-producto">
                          {n.nombreProducto}
                          {n.cantidadItems > 1 && ` y ${n.cantidadItems - 1} más`}
                        </span>
                        <span className="campana-pedido-detalle">
                          {n.cantidad} u. · ${Number(n.total).toLocaleString('es-AR')}
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="campana-mensaje">
                      {n.motivoRechazo ? n.mensaje.split('Motivo: ')[0] : n.mensaje}
                      {n.motivoRechazo && (
                        <span className="campana-motivo">Motivo: {n.motivoRechazo}</span>
                      )}
                    </span>
                  )}
                  <span className="campana-fecha">{formatFecha(n.fechaCreacion)}</span>
                </span>
              </button>
            ))
          }
        </div>
      )}
    </div>
  )
}

export default CampanaNotificaciones
