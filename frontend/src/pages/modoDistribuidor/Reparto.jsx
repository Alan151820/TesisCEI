import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../lib/axios'
import EstadoBadge from '../../components/EstadoBadge'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import Tabla from '../../components/ui/Tabla'
import TablaHeader from '../../components/ui/TablaHeader'
import TablaFila from '../../components/ui/TablaFila'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Modal from '../../components/ui/Modal'
import ModalHeader from '../../components/ui/ModalHeader'
import ModalBody from '../../components/ui/ModalBody'
import ModalFooter from '../../components/ui/ModalFooter'
import EsqueletoFilas from '../../components/ui/EsqueletoFilas'
import EstadoLista from '../../components/ui/EstadoLista'
import './Inicio.css'
import './MisPedidos.css'
import './Reparto.css'

const COLUMNAS = ['Reparto', 'Fecha', { label: 'Estado', className: 'reparto-celda--centro' }, 'Progreso', '']
const GRID = '80px 120px 120px 1fr 100px'

function formatearFecha(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Reparto() {
  const navigate = useNavigate()
  const location = useLocation()

  const [planes, setPlanes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [eliminandoId, setEliminandoId] = useState(null)
  const [errorEliminar, setErrorEliminar] = useState('')
  const [mensajeEliminado, setMensajeEliminado] = useState(location.state?.mensaje || '')
  const [planEliminar, setPlanEliminar] = useState(null)

  const [planCerrar, setPlanCerrar] = useState(null)
  const [motivoCerrar, setMotivoCerrar] = useState('')
  const [cerrandoEnBloque, setCerrandoEnBloque] = useState(false)
  const [errorCerrar, setErrorCerrar] = useState('')

  const cargarPlanes = () => {
    setCargando(true)
    api.get('/api/reparto/planes')
      .then(res => setPlanes(res.data))
      .catch(err => setError(mensajeDeError(err)))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarPlanes() }, [])

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
    setPlanEliminar(plan)
  }

  const handleConfirmarEliminar = () => {
    setEliminandoId(planEliminar.id)
    api.delete(`/api/reparto/${planEliminar.id}`)
      .then(res => {
        setMensajeEliminado(res.data.mensaje)
        cargarPlanes()
      })
      .catch(err => setErrorEliminar(mensajeDeError(err)))
      .finally(() => {
        setEliminandoId(null)
        setPlanEliminar(null)
      })
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
      setErrorCerrar(mensajeDeError(err))
    } finally {
      setCerrandoEnBloque(false)
    }
  }

  return (
    <PanelDistribuidor>
          <div className="panel-seccion-header panel-seccion-header--sub">
            <div>
              <h1 className="panel-h1">Panel de repartos</h1>
              <p className="panel-subtitulo">Todos tus repartos, en cualquier estado, con su avance.</p>
            </div>
            <button className="panel-btn-nuevo" onClick={() => navigate('/reparto/nuevo')}>
              + Crear reparto
            </button>
          </div>

          {cargando && (
            <Tabla grid={GRID} className="panel-tabla-reflow">
              <TablaHeader columnas={COLUMNAS} className="reparto-panel-header" />
              <EsqueletoFilas columnas={COLUMNAS.length} />
            </Tabla>
          )}

          {!cargando && error && (
            <EstadoLista variante="error">{error}</EstadoLista>
          )}

          {!cargando && !error && planes.length === 0 && (
            <EstadoLista>Aún no generaste ningún plan de reparto.</EstadoLista>
          )}

          {!cargando && !error && planes.length > 0 && (
            <Tabla grid={GRID} className="panel-tabla-reflow">
              <TablaHeader columnas={COLUMNAS} className="reparto-panel-header" />

              {planes.map(plan => (
                <TablaFila
                  key={plan.id}
                  className="reparto-panel-fila"
                  onClick={() => navigate(`/reparto/${plan.id}`)}
                >
                  <div className="reparto-celda">#{plan.id}</div>
                  <div className="reparto-celda">{formatearFecha(plan.fechaCreacion)}</div>
                  <div className="reparto-celda reparto-celda--centro"><EstadoBadge estado={plan.estado} /></div>
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
                </TablaFila>
              ))}
            </Tabla>
          )}

          {errorEliminar && (
            <div className="panel-error-visibilidad">{errorEliminar}</div>
          )}
          {mensajeEliminado && (
            <div className="panel-tabla-vacio">{mensajeEliminado}</div>
          )}

      {planCerrar && (
        <Modal onCerrar={() => setPlanCerrar(null)}>
          <ModalHeader titulo={`Cerrar reparto #${planCerrar.id}`} onCerrar={() => setPlanCerrar(null)} />
          <ModalBody>
            <p className="texto-mudo" style={{ margin: 0 }}>
              Las paradas pendientes de este reparto se van a marcar como Omitida con el motivo que ingreses acá, y el reparto va a quedar Finalizado.
            </p>
            <Campo
              area
              rows={4}
              placeholder="Motivo (por ejemplo: se reprograma para otro día)"
              value={motivoCerrar}
              onChange={e => setMotivoCerrar(e.target.value)}
            />
            {errorCerrar && (
              <div className="panel-error-visibilidad">{errorCerrar}</div>
            )}
          </ModalBody>
          <ModalFooter>
            <Boton variante="outline" onClick={() => setPlanCerrar(null)}>Cancelar</Boton>
            <Boton variante="peligro" disabled={cerrandoEnBloque} onClick={handleCerrarEnBloque}>
              {cerrandoEnBloque ? 'Cerrando…' : 'Confirmar cierre'}
            </Boton>
          </ModalFooter>
        </Modal>
      )}

      {planEliminar && (
        <Modal onCerrar={() => setPlanEliminar(null)}>
          <ModalHeader titulo={`Eliminar reparto #${planEliminar.id}`} onCerrar={() => setPlanEliminar(null)} />
          <ModalBody>
            <p className="texto-mudo" style={{ margin: 0 }}>
              ¿Eliminar el reparto #{planEliminar.id}? Esta acción no se puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Boton variante="outline" onClick={() => setPlanEliminar(null)}>Cancelar</Boton>
            <Boton variante="peligro" disabled={eliminandoId === planEliminar.id} onClick={handleConfirmarEliminar}>
              {eliminandoId === planEliminar.id ? 'Eliminando…' : 'Eliminar reparto'}
            </Boton>
          </ModalFooter>
        </Modal>
      )}
    </PanelDistribuidor>
  )
}

export default Reparto
