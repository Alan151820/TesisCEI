import { useState, useEffect, useMemo } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../lib/axios'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import Tabla from '../../components/ui/Tabla'
import TablaHeader from '../../components/ui/TablaHeader'
import TablaFila from '../../components/ui/TablaFila'
import './Inicio.css'
import './MisPedidos.css'
import './Reparto.css'

const MONTEVIDEO = [-34.9011, -56.1645]
const COLUMNAS = ['', 'N° Pedido', 'Comprador', 'Dirección de entrega', 'Productos']
const GRID = '44px 120px 180px 1fr 200px'

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
      .catch(err => setError(mensajeDeError(err)))
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

  const handleGenerarPlan = async () => {
    setErrorGenerar('')
    setGenerando(true)
    try {
      const res = await api.post('/api/reparto/generar', { pedidoIds: [...seleccionados] })
      navigate(`/reparto/${res.data.plan.id}`)
    } catch (err) {
      setErrorGenerar(mensajeDeError(err))
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
    <PanelDistribuidor activo="/reparto">
          <div className="panel-seccion-header reparto-crear-header">
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
                <Tabla grid={GRID} className="panel-tabla-reflow">
                  <TablaHeader columnas={COLUMNAS} className="reparto-tabla-header" />

                  {pedidos.map(p => (
                    <TablaFila key={p.id} className="reparto-tabla-fila">
                      <div className="reparto-celda">
                        <input
                          type="checkbox"
                          className="checkbox"
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
                    </TablaFila>
                  ))}
                </Tabla>

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
