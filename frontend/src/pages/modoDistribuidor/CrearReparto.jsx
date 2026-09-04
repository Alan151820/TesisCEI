import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import './Inicio.css'
import './MisPedidos.css'
import './Reparto.css'

const MONTEVIDEO = [-34.9011, -56.1645]

// Íconos como círculos de color (CSS var, no PNG): evita el workaround de
// rutas de imagen de Leaflet en Vite (ver ModalMapaDireccion) y permite que
// el color siga el sistema de color del proyecto (guía 07), tema
// claro/oscuro incluido.
function crearIcono(colorVar, tamano) {
  return L.divIcon({
    className: 'reparto-mapa-icono',
    html: `<span style="background:var(${colorVar})"></span>`,
    iconSize: [tamano, tamano],
    iconAnchor: [tamano / 2, tamano / 2],
  })
}

const ICONO_DEPOSITO = crearIcono('--color-secundario', 18)
const ICONO_SELECCIONADO = crearIcono('--color-primario', 16)
const ICONO_DISPONIBLE = crearIcono('--color-sobre-variante-superficie', 10)

// Encuadra el mapa para mostrar todos los puntos disponibles (no cambia con
// la selección, así el click en un punto no reacomoda la vista).
function AjustarVista({ puntos }) {
  const map = useMap()
  useEffect(() => {
    if (puntos.length === 0) return
    if (puntos.length === 1) {
      map.setView(puntos[0], 14)
      return
    }
    map.fitBounds(puntos, { padding: [30, 30] })
  }, [puntos, map])
  return null
}

// RF-043: selección de pedidos con mapa interactivo bidireccional — tildar
// en la lista agrega/resalta el punto en el mapa, y tocar un punto en el
// mapa agrega o quita ese pedido de la selección. RF-044 (creación del
// reparto en sí) sigue con su comportamiento previo: no reordena por
// distancia acá ni ingresa automáticamente al reparto creado todavía.
function CrearReparto() {
  const navigate = useNavigate()

  const [direccionPartida, setDireccionPartida] = useState('')
  const [latitudPartida, setLatitudPartida] = useState(null)
  const [longitudPartida, setLongitudPartida] = useState(null)
  const [perfilCargado, setPerfilCargado] = useState(false)

  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [seleccionados, setSeleccionados] = useState(new Set())

  const [generando, setGenerando] = useState(false)
  const [errorGenerar, setErrorGenerar] = useState('')

  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  useEffect(() => {
    api.post('/distribuidor/obtenerPerfilPropio')
      .then(res => {
        setDireccionPartida(res.data.direccionPartida || '')
        setLatitudPartida(res.data.latitud ?? null)
        setLongitudPartida(res.data.longitud ?? null)
      })
      .catch(() => setDireccionPartida(''))
      .finally(() => setPerfilCargado(true))
  }, [])

  useEffect(() => {
    api.get('/api/pedidos/disponibles-reparto')
      .then(res => setPedidos(res.data))
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }, [])

  const alternarSeleccion = (pedidoId) => {
    setSeleccionados(prev => {
      const siguiente = new Set(prev)
      if (siguiente.has(pedidoId)) siguiente.delete(pedidoId)
      else siguiente.add(pedidoId)
      return siguiente
    })
  }

  // RF-044: al crear el reparto, ingresa automáticamente a su vista de
  // progreso — ya no se queda en esta pantalla mostrando un mensaje.
  const handleGenerarPlan = async () => {
    setErrorGenerar('')
    setGenerando(true)
    try {
      const res = await api.post('/api/reparto/generar', { pedidoIds: [...seleccionados] })
      navigate(`/reparto/${res.data.plan.id}`)
    } catch (err) {
      setErrorGenerar(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
      setGenerando(false)
    }
  }

  const pedidosConUbicacion = useMemo(
    () => pedidos.filter(p => p.latitud != null && p.longitud != null),
    [pedidos]
  )

  const puntosVista = useMemo(() => {
    const puntos = pedidosConUbicacion.map(p => [Number(p.latitud), Number(p.longitud)])
    if (latitudPartida != null && longitudPartida != null) {
      puntos.push([Number(latitudPartida), Number(longitudPartida)])
    }
    return puntos
  }, [pedidosConUbicacion, latitudPartida, longitudPartida])

  return (
    <PanelDistribuidor tituloMobile="Crear reparto" activo="/reparto">
          <div className="panel-seccion-header">
            <div>
              <h1 className="panel-h1">Crear reparto</h1>
              <p className="panel-subtitulo">Seleccioná los pedidos a incluir, desde la lista o tocando sus puntos en el mapa. Necesitás al menos 2 pedidos.</p>
            </div>
            <button type="button" className="reparto-btn-volver" onClick={() => navigate('/reparto')}>← Volver al panel</button>
          </div>

          {!perfilCargado && (
            <div className="panel-tabla-vacio">Cargando...</div>
          )}

          {perfilCargado && !direccionPartida && (
            <div className="panel-tabla-vacio">
              Registrá la dirección de partida del depósito antes de generar el plan.{' '}
              <span className="panel-tabla-vacio-link" onClick={() => navigate('/editarPerfil')}>Ir a Editar perfil</span>
            </div>
          )}

          {perfilCargado && direccionPartida && cargando && (
            <div className="panel-tabla-vacio">Cargando pedidos...</div>
          )}

          {perfilCargado && direccionPartida && !cargando && error && (
            <div className="panel-tabla-vacio pedidos-error">{error}</div>
          )}

          {perfilCargado && direccionPartida && !cargando && !error && pedidos.length === 0 && (
            <div className="panel-tabla-vacio">No hay pedidos aceptados disponibles para planificar.</div>
          )}

          {perfilCargado && direccionPartida && !cargando && !error && pedidos.length > 0 && (
            <div className="reparto-crear-layout">
              <div className="reparto-crear-lista">
                <div className="panel-tabla-wrapper">
                  <div className="reparto-tabla-header">
                    <div></div>
                    <div>N° Pedido</div>
                    <div>Comprador</div>
                    <div>Dirección de entrega</div>
                    <div>Productos</div>
                  </div>

                  {pedidos.map(p => (
                    <div key={p.id} className="reparto-tabla-fila">
                      <div className="reparto-celda">
                        <input
                          type="checkbox"
                          checked={seleccionados.has(p.id)}
                          onChange={() => alternarSeleccion(p.id)}
                        />
                      </div>
                      <div className="reparto-celda">#{p.id}</div>
                      <div className="reparto-celda">{p.nombreComprador}</div>
                      <div className="reparto-celda">{p.direccionEntrega}</div>
                      <div className="reparto-celda">
                        {p.items.map(it => `${it.nombreProducto} ×${Number(it.cantidad)}`).join(', ')}
                      </div>
                    </div>
                  ))}

                  <div className="reparto-pie">
                    <div className="panel-tabla-contador">
                      {seleccionados.size} pedido{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''} de {pedidos.length} disponible{pedidos.length !== 1 ? 's' : ''}
                    </div>
                    <button className="panel-btn-nuevo" onClick={handleGenerarPlan} disabled={seleccionados.size < 2 || generando}>
                      {generando ? 'Generando…' : `Generar plan de carga (${seleccionados.size} parada${seleccionados.size !== 1 ? 's' : ''})`}
                    </button>
                  </div>

                  {seleccionados.size < 2 && (
                    <div className="panel-error-visibilidad">Seleccioná al menos dos pedidos para generar la planificación.</div>
                  )}

                  {errorGenerar && (
                    <div className="panel-error-visibilidad">{errorGenerar}</div>
                  )}
                </div>
              </div>

              <div className="reparto-crear-mapa-wrapper">
                <div className="reparto-crear-mapa">
                  <MapContainer center={latitudPartida != null ? [Number(latitudPartida), Number(longitudPartida)] : MONTEVIDEO} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <AjustarVista puntos={puntosVista} />

                    {latitudPartida != null && longitudPartida != null && (
                      <Marker position={[Number(latitudPartida), Number(longitudPartida)]} icon={ICONO_DEPOSITO}>
                        <Tooltip permanent direction="top" className="reparto-mapa-tooltip">Depósito</Tooltip>
                      </Marker>
                    )}

                    {pedidosConUbicacion.map(p => (
                      <Marker
                        key={p.id}
                        position={[Number(p.latitud), Number(p.longitud)]}
                        icon={seleccionados.has(p.id) ? ICONO_SELECCIONADO : ICONO_DISPONIBLE}
                        eventHandlers={{ click: () => alternarSeleccion(p.id) }}
                      >
                        {seleccionados.has(p.id) && (
                          <Tooltip permanent direction="top" className="reparto-mapa-tooltip">
                            {p.nombreComprador}<br />
                            {p.items.map(it => `${it.nombreProducto} ×${Number(it.cantidad)}`).join(', ')}
                          </Tooltip>
                        )}
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>
          )}
    </PanelDistribuidor>
  )
}

export default CrearReparto
