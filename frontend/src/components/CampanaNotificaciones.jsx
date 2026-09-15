import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import useDesplegable from '../hooks/useDesplegable'
import Boton from './ui/Boton'
import './CampanaNotificaciones.css'

function CampanaNotificaciones({ rutaDestino = '/misPedidos', rutaDetalle }) {
  const navigate = useNavigate()
  const [notificaciones, setNotificaciones] = useState([])
  const { abierto, setAbierto, ref } = useDesplegable()

  useEffect(() => {
    api.get('/api/notificaciones')
      .then(res => setNotificaciones(res.data))
      .catch(() => {})
  }, [])

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
    setAbierto(false)
    if (notif.pedidoId) navigate(rutaDetalle ? `${rutaDetalle}/${notif.pedidoId}` : rutaDestino)
  }

  return (
    <div className="desplegable-ancla campana" ref={ref}>
      <Boton variante="icono" badge={noLeidas} onClick={() => setAbierto(v => !v)} aria-label="Notificaciones">🔔</Boton>
      {abierto && (
        <div className="desplegable">
          {notificaciones.length === 0
            ? <div className="desplegable-vacio">No tenés notificaciones.</div>
            : notificaciones.map(n => (
              <button
                key={n.id}
                type="button"
                className={`desplegable-item${!n.leida ? ' desplegable-item--noleida' : ''}`}
                onClick={() => handleClickNotif(n)}
              >
                {!n.leida && <span className="desplegable-punto" />}
                {n.nombreProducto ? (
                  <span className="campana-pedido-fila">
                    {n.imagenUrl
                      ? <img src={`http://localhost:3000${n.imagenUrl}`} alt="" className="campana-pedido-imagen" />
                      : <span className="campana-pedido-imagen-placeholder" />
                    }
                    <span className="desplegable-cuerpo">
                      <span>
                        {n.motivoRechazo ? n.mensaje.split('Motivo: ')[0] : n.mensaje}
                        {n.motivoRechazo && (
                          <span className="campana-motivo">Motivo: {n.motivoRechazo}</span>
                        )}
                      </span>
                      <span className="texto-mudo">
                        {n.nombreProducto}
                        {n.cantidadItems > 1 && ` y ${n.cantidadItems - 1} más`}
                        {' · '}{n.cantidad} u. · ${Number(n.total).toLocaleString('es-AR')}
                      </span>
                      <span className="desplegable-fecha">{formatFecha(n.fechaCreacion)}</span>
                    </span>
                  </span>
                ) : (
                  <span className="desplegable-cuerpo">
                    <span>
                      {n.motivoRechazo ? n.mensaje.split('Motivo: ')[0] : n.mensaje}
                      {n.motivoRechazo && (
                        <span className="campana-motivo">Motivo: {n.motivoRechazo}</span>
                      )}
                    </span>
                    <span className="desplegable-fecha">{formatFecha(n.fechaCreacion)}</span>
                  </span>
                )}
              </button>
            ))
          }
        </div>
      )}
    </div>
  )
}

export default CampanaNotificaciones
