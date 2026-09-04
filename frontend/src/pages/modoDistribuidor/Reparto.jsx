import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import EstadoBadge from '../../components/EstadoBadge'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import './Inicio.css'
import './MisPedidos.css'
import './Reparto.css'

function formatearFecha(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// RF-063: panel único de repartos — punto de entrada a toda la gestión de
// reparto. Lista todos los repartos del distribuidor en cualquier estado,
// deja entrar a cualquiera (RF-045, todavía no construido) y crear uno
// nuevo (RF-043, en /reparto/nuevo).
function Reparto() {
  const navigate = useNavigate()
  const location = useLocation()

  const [planes, setPlanes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [eliminandoId, setEliminandoId] = useState(null)
  const [errorEliminar, setErrorEliminar] = useState('')
  const [mensajeEliminado, setMensajeEliminado] = useState(location.state?.mensaje || '')

  // RF-067: cerrar en bloque las paradas restantes de un reparto "En
  // curso" — es lo que dispara la cruz del panel para un reparto en
  // progreso, en vez de RF-065 (que solo aplica a "Sin empezar").
  const [planCerrar, setPlanCerrar] = useState(null)
  const [motivoCerrar, setMotivoCerrar] = useState('')
  const [cerrandoEnBloque, setCerrandoEnBloque] = useState(false)
  const [errorCerrar, setErrorCerrar] = useState('')

  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  const cargarPlanes = () => {
    setCargando(true)
    api.get('/api/reparto/planes')
      .then(res => setPlanes(res.data))
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarPlanes() }, [])

  // RF-065: elimina un reparto "Sin empezar". Para uno "En curso" la cruz
  // no borra el registro — abre el modal de cierre en bloque (RF-067),
  // porque un reparto en progreso no se elimina, se cierra.
  const handleQuitarReparto = (e, plan) => {
    e.stopPropagation()
    if (plan.estado === 'en_curso') {
      setMotivoCerrar('')
      setErrorCerrar('')
      setPlanCerrar(plan)
      return
    }

    setErrorEliminar('')
    setMensajeEliminado('')
    if (!window.confirm(`¿Eliminar el reparto #${plan.id}? Esta acción no se puede deshacer.`)) return

    setEliminandoId(plan.id)
    api.delete(`/api/reparto/${plan.id}`)
      .then(res => {
        setMensajeEliminado(res.data.mensaje)
        cargarPlanes()
      })
      .catch(err => setErrorEliminar(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setEliminandoId(null))
  }

  const handleCerrarEnBloque = async () => {
    setErrorCerrar('')
    if (!motivoCerrar.trim()) {
      setErrorCerrar('Ingresá un motivo antes de confirmar.')
      return
    }

    setCerrandoEnBloque(true)
    try {
      await api.post(`/api/reparto/${planCerrar.id}/cerrar-en-bloque`, { motivo: motivoCerrar.trim() })
      setPlanCerrar(null)
      cargarPlanes()
    } catch (err) {
      setErrorCerrar(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCerrandoEnBloque(false)
    }
  }

  return (
    <PanelDistribuidor tituloMobile="Reparto">
          <div className="panel-seccion-header">
            <div>
              <h1 className="panel-h1">Panel de repartos</h1>
              <p className="panel-subtitulo">Todos tus repartos, en cualquier estado, con su avance.</p>
            </div>
            <button className="panel-btn-nuevo" onClick={() => navigate('/reparto/nuevo')}>
              + Crear reparto
            </button>
          </div>

          {cargando && (
            <div className="panel-tabla-vacio">Cargando repartos...</div>
          )}

          {!cargando && error && (
            <div className="panel-tabla-vacio pedidos-error">{error}</div>
          )}

          {!cargando && !error && planes.length === 0 && (
            <div className="panel-tabla-vacio">Aún no generaste ningún plan de reparto.</div>
          )}

          {!cargando && !error && planes.length > 0 && (
            <div className="panel-tabla-wrapper">
              <div className="reparto-panel-header">
                <div>Reparto</div>
                <div>Fecha</div>
                <div>Estado</div>
                <div>Progreso</div>
                <div></div>
              </div>

              {planes.map(plan => (
                <div
                  key={plan.id}
                  className="reparto-panel-fila reparto-panel-fila--clickeable"
                  onClick={() => navigate(`/reparto/${plan.id}`)}
                >
                  <div className="reparto-celda">#{plan.id}</div>
                  <div className="reparto-celda">{formatearFecha(plan.fechaCreacion)}</div>
                  <div className="reparto-celda"><EstadoBadge estado={plan.estado} /></div>
                  <div className="reparto-celda">
                    <div className="reparto-progreso">
                      <div className="reparto-progreso-barra">
                        <div
                          className="reparto-progreso-relleno"
                          style={{ width: `${plan.totalParadas ? (plan.paradasResueltas / plan.totalParadas) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="reparto-progreso-texto">{plan.paradasResueltas} de {plan.totalParadas}</span>
                    </div>
                  </div>
                  <div className="reparto-celda">
                    {plan.estado !== 'finalizado' && (
                      <button
                        type="button"
                        className="reparto-btn-cruz"
                        disabled={eliminandoId === plan.id}
                        title={plan.estado === 'en_curso' ? 'Cerrar reparto' : 'Eliminar reparto'}
                        onClick={(e) => handleQuitarReparto(e, plan)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {errorEliminar && (
            <div className="panel-error-visibilidad">{errorEliminar}</div>
          )}
          {mensajeEliminado && (
            <div className="panel-tabla-vacio">{mensajeEliminado}</div>
          )}

      {planCerrar && (
        <div className="reparto-modal-overlay" onClick={() => setPlanCerrar(null)}>
          <div className="reparto-modal" onClick={e => e.stopPropagation()}>
            <div className="reparto-modal-header">
              <div className="reparto-modal-titulo">Cerrar reparto #{planCerrar.id}</div>
              <button type="button" className="reparto-modal-cerrar" onClick={() => setPlanCerrar(null)}>✕</button>
            </div>

            <div className="reparto-modal-body">
              <p className="panel-subtitulo" style={{ marginBottom: 10 }}>
                Las paradas pendientes de este reparto se van a marcar como Omitida con el motivo que ingreses acá, y el reparto va a quedar Finalizado.
              </p>
              <textarea
                className="reparto-modal-textarea"
                rows={4}
                placeholder="Motivo (por ejemplo: se reprograma para otro día)"
                value={motivoCerrar}
                onChange={e => setMotivoCerrar(e.target.value)}
              />
              {errorCerrar && (
                <div className="panel-error-visibilidad">{errorCerrar}</div>
              )}
            </div>

            <div className="reparto-modal-footer">
              <button type="button" className="reparto-btn-volver" onClick={() => setPlanCerrar(null)}>Cancelar</button>
              <button
                type="button"
                className="pedidos-accion-btn pedidos-accion-btn--peligro"
                style={{ width: 'auto' }}
                disabled={cerrandoEnBloque}
                onClick={handleCerrarEnBloque}
              >
                {cerrandoEnBloque ? 'Cerrando…' : 'Confirmar cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelDistribuidor>
  )
}

export default Reparto
