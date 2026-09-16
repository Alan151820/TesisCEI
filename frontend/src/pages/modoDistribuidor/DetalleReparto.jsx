import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../lib/axios'
import EstadoBadge from '../../components/EstadoBadge'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import Tabla from '../../components/ui/Tabla'
import TablaHeader from '../../components/ui/TablaHeader'
import TablaFila from '../../components/ui/TablaFila'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import ModalHeader from '../../components/ui/ModalHeader'
import ModalBody from '../../components/ui/ModalBody'
import ModalFooter from '../../components/ui/ModalFooter'
import './Inicio.css'
import './MisPedidos.css'
import './Reparto.css'

const COLUMNAS_PARADAS = ['N°', 'Pedido', 'Comprador', 'Dirección', { label: 'Estado', className: 'reparto-celda--centro' }, 'Acciones']
const GRID_PARADAS = '36px 80px 130px 1fr 90px 320px'

function crearIcono(colorVar, tamano) {
  return L.divIcon({
    className: 'reparto-mapa-icono',
    html: `<span style="background:var(${colorVar})"></span>`,
    iconSize: [tamano, tamano],
    iconAnchor: [tamano / 2, tamano / 2],
  })
}

const ICONO_POR_ESTADO = {
  pendiente: crearIcono('--color-primario', 16),
  entregado: crearIcono('--color-exito', 16),
  rechazado: crearIcono('--color-error', 16),
  omitido: crearIcono('--color-advertencia', 16),
}

const ICONO_DEPOSITO = L.divIcon({
  className: 'reparto-mapa-icono',
  html: `<span style="background:var(--color-sobre-superficie);border-radius:3px"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const ICONO_DISTRIBUIDOR = L.divIcon({
  className: 'reparto-mapa-icono',
  html: `<span style="background:var(--color-info)"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function formatearResumenRuta(distanciaMetros, duracionSegundos) {
  const km = (distanciaMetros / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })
  const minutosTotales = Math.round(duracionSegundos / 60)
  const horas = Math.floor(minutosTotales / 60)
  const minutos = minutosTotales % 60
  const tiempo = horas > 0 ? `${horas} h ${minutos} min` : `${minutos} min`
  return `≈ ${km} km · ${tiempo}`
}

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

function DetalleReparto() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [errorEditar, setErrorEditar] = useState('')
  const [quitandoId, setQuitandoId] = useState(null)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [disponibles, setDisponibles] = useState([])
  const [cargandoDisponibles, setCargandoDisponibles] = useState(false)
  const [errorModal, setErrorModal] = useState('')
  const [seleccionModal, setSeleccionModal] = useState(new Set())
  const [agregando, setAgregando] = useState(false)

  const [iniciando, setIniciando] = useState(false)
  const [errorIniciar, setErrorIniciar] = useState('')

  const [marcandoId, setMarcandoId] = useState(null)
  const [errorMarcar, setErrorMarcar] = useState('')
  const [paradaEntregar, setParadaEntregar] = useState(null)
  const [paradaMotivo, setParadaMotivo] = useState(null)
  const [motivoTexto, setMotivoTexto] = useState('')
  const [confirmandoMotivo, setConfirmandoMotivo] = useState(false)
  const [errorMotivo, setErrorMotivo] = useState('')

  const [menuEstadoId, setMenuEstadoId] = useState(null)
  const menuEstadoRef = useRef(null)

  useEffect(() => {
    if (menuEstadoId == null) return
    const cerrar = (e) => { if (!menuEstadoRef.current?.contains(e.target)) setMenuEstadoId(null) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [menuEstadoId])

  const cargarDetalle = useCallback(() => {
    setCargando(true)
    setError(null)
    api.get(`/api/reparto/${id}`)
      .then(res => setDetalle(res.data))
      .catch(err => setError(mensajeDeError(err)))
      .finally(() => setCargando(false))
  }, [id])

  useEffect(() => { cargarDetalle() }, [cargarDetalle])

  const pedidosIncluidos = (detalle?.paradas || []).filter(p => p.estadoParada === 'pendiente')
  const pedidosIncluidosIds = pedidosIncluidos.map(p => p.pedidoId)

  const guardarPedidos = (idsDeseados) =>
    api.put(`/api/reparto/${id}/pedidos`, { pedidoIds: idsDeseados }).then(() => cargarDetalle())

  const handleQuitar = async (pedidoId) => {
    setErrorEditar('')
    setQuitandoId(pedidoId)
    try {
      await guardarPedidos(pedidosIncluidosIds.filter(pid => pid !== pedidoId))
    } catch (err) {
      setErrorEditar(mensajeDeError(err))
    } finally {
      setQuitandoId(null)
    }
  }

  const abrirModal = () => {
    setModalAbierto(true)
    setSeleccionModal(new Set())
    setErrorModal('')
    setCargandoDisponibles(true)
    api.get('/api/pedidos/disponibles-reparto', { params: { planId: id } })
      .then(res => setDisponibles(res.data.filter(p => !pedidosIncluidosIds.includes(p.id))))
      .catch(err => setErrorModal(mensajeDeError(err)))
      .finally(() => setCargandoDisponibles(false))
  }

  const alternarSeleccionModal = (pedidoId) => {
    setSeleccionModal(prev => {
      const siguiente = new Set(prev)
      if (siguiente.has(pedidoId)) siguiente.delete(pedidoId)
      else siguiente.add(pedidoId)
      return siguiente
    })
  }

  const handleAgregar = async () => {
    setErrorModal('')
    setAgregando(true)
    try {
      await guardarPedidos([...pedidosIncluidosIds, ...seleccionModal])
      setModalAbierto(false)
    } catch (err) {
      setErrorModal(mensajeDeError(err))
    } finally {
      setAgregando(false)
    }
  }

  const handleIniciar = async () => {
    setErrorIniciar('')
    setIniciando(true)
    try {
      await api.post(`/api/reparto/${id}/iniciar`)
      cargarDetalle()
    } catch (err) {
      setErrorIniciar(mensajeDeError(err))
    } finally {
      setIniciando(false)
    }
  }

  const marcarParada = (paradaId, accion, motivo) =>
    api.post(`/api/reparto/${id}/paradas/${paradaId}/marcar`, { accion, motivo })

  const handleMarcarEntregado = (parada) => {
    setMenuEstadoId(null)
    setErrorMarcar('')
    setParadaEntregar(parada)
  }

  const handleConfirmarEntregado = async () => {
    setErrorMarcar('')
    setMarcandoId(paradaEntregar.id)
    try {
      await marcarParada(paradaEntregar.id, 'entregado')
      cargarDetalle()
    } catch (err) {
      setErrorMarcar(mensajeDeError(err))
    } finally {
      setMarcandoId(null)
      setParadaEntregar(null)
    }
  }

  const abrirModalMotivo = (parada, accion) => {
    setMenuEstadoId(null)
    setParadaMotivo({ parada, accion })
    setMotivoTexto('')
    setErrorMotivo('')
  }

  const handleConfirmarMotivo = async () => {
    setErrorMotivo('')
    if (!motivoTexto.trim()) {
      setErrorMotivo('Ingresá un motivo antes de confirmar.')
      return
    }
    setConfirmandoMotivo(true)
    try {
      await marcarParada(paradaMotivo.parada.id, paradaMotivo.accion, motivoTexto.trim())
      setParadaMotivo(null)
      cargarDetalle()
    } catch (err) {
      setErrorMotivo(mensajeDeError(err))
    } finally {
      setConfirmandoMotivo(false)
    }
  }

  const puedeEditar = detalle?.plan.estado !== 'finalizado'
  const puedeIniciar = detalle?.plan.estado === 'sin_empezar'

  const paradas = detalle?.paradas || []
  const paradasResueltas = paradas.filter(p => p.estadoParada !== 'pendiente').length
  const progresoPorcentaje = paradas.length > 0 ? Math.round((paradasResueltas / paradas.length) * 100) : 0

  const paradasConUbicacion = useMemo(
    () => paradas.filter(p => p.latitud != null && p.longitud != null),
    [paradas]
  )

  const depositoLat = detalle?.plan?.depositoLatitud
  const depositoLng = detalle?.plan?.depositoLongitud

  const [rutaCoords, setRutaCoords] = useState(null)
  const [rutaResumen, setRutaResumen] = useState(null)

  useEffect(() => {
    if (depositoLat == null || depositoLng == null || paradasConUbicacion.length === 0) {
      setRutaCoords(null)
      setRutaResumen(null)
      return
    }
    let cancelado = false
    const puntos = [
      `${depositoLng},${depositoLat}`,
      ...paradasConUbicacion.map(p => `${p.longitud},${p.latitud}`),
    ].join(';')

    fetch(`https://router.project-osrm.org/route/v1/driving/${puntos}?overview=full&geometries=geojson`, {
      signal: AbortSignal.timeout(5000),
    })
      .then(res => res.json())
      .then(data => {
        if (cancelado) return
        const ruta = data.routes?.[0]
        const coords = ruta?.geometry?.coordinates
        setRutaCoords(coords ? coords.map(([lng, lat]) => [lat, lng]) : null)
        setRutaResumen(
          ruta && typeof ruta.distance === 'number' && typeof ruta.duration === 'number'
            ? formatearResumenRuta(ruta.distance, ruta.duration)
            : null
        )
      })
      .catch(() => { if (!cancelado) { setRutaCoords(null); setRutaResumen(null) } })

    return () => { cancelado = true }
  }, [depositoLat, depositoLng, paradasConUbicacion])

  const handleVerRuta = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  const ultimoEnvioRef = useRef(0)
  const [miPosicion, setMiPosicion] = useState(null)
  useEffect(() => {
    if (detalle?.plan?.estado !== 'en_curso' || !navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setMiPosicion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        const ahora = Date.now()
        if (ahora - ultimoEnvioRef.current < 8000) return
        ultimoEnvioRef.current = ahora
        api.patch(`/api/reparto/${id}/ubicacion`, {
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
        }).catch(() => {})
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [detalle?.plan?.estado, id])

  return (
    <PanelDistribuidor activo="/reparto">
          <div className="panel-seccion-header reparto-detalle-header">
            <div>
              <h1 className="panel-h1">
                Reparto #{id} {detalle && <EstadoBadge estado={detalle.plan.estado} />}
              </h1>
              {detalle && paradas.length > 0 ? (
                <>
                  <div className="reparto-progreso">
                    <div className="reparto-progreso-barra">
                      <div className="reparto-progreso-relleno" style={{ width: `${progresoPorcentaje}%` }}></div>
                    </div>
                    <div className="reparto-progreso-texto">{paradasResueltas} / {paradas.length} paradas resueltas</div>
                  </div>
                  {rutaResumen && (
                    <div className="reparto-progreso-texto reparto-progreso-resumen">{rutaResumen}</div>
                  )}
                </>
              ) : (
                <p className="panel-subtitulo">Todavía no tiene paradas.</p>
              )}
            </div>
            <div className="reparto-detalle-header-acciones">
              {!cargando && detalle && puedeIniciar && (
                <button
                  type="button"
                  className="pedidos-accion-btn pedidos-accion-btn--primario"
                  disabled={iniciando}
                  onClick={handleIniciar}
                >
                  {iniciando ? 'Iniciando…' : 'Iniciar reparto'}
                </button>
              )}
              <button type="button" className="reparto-btn-volver reparto-btn-volver--negro" onClick={() => navigate('/reparto')}>Volver</button>
            </div>
          </div>

          {cargando && (
            <div className="panel-tabla-vacio">Cargando reparto...</div>
          )}

          {!cargando && error && (
            <div className="panel-tabla-vacio pedidos-error">{error}</div>
          )}

          {errorIniciar && (
            <div className="panel-error-visibilidad">{errorIniciar}</div>
          )}

          {!cargando && !error && detalle && (
            <>
              {paradas.length > 0 && (
                <div className="reparto-detalle-mapa-wrapper reparto-progreso-mapa-wrapper">
                  <div className="reparto-progreso-mapa">
                    <MapContainer center={paradasConUbicacion[0] ? [Number(paradasConUbicacion[0].latitud), Number(paradasConUbicacion[0].longitud)] : [-34.9011, -56.1645]} zoom={12} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <AjustarVista puntos={[
                        ...(depositoLat != null && depositoLng != null ? [[Number(depositoLat), Number(depositoLng)]] : []),
                        ...paradasConUbicacion.map(p => [Number(p.latitud), Number(p.longitud)]),
                      ]} />
                      {rutaCoords && (
                        <Polyline positions={rutaCoords} pathOptions={{ color: 'var(--color-primario)', weight: 4, opacity: 0.7 }} />
                      )}
                      {depositoLat != null && depositoLng != null && (
                        <Marker position={[Number(depositoLat), Number(depositoLng)]} icon={ICONO_DEPOSITO}>
                          <Tooltip direction="top" className="reparto-mapa-tooltip">Depósito</Tooltip>
                        </Marker>
                      )}
                      {paradasConUbicacion.map(p => (
                        <Marker
                          key={p.id}
                          position={[Number(p.latitud), Number(p.longitud)]}
                          icon={ICONO_POR_ESTADO[p.estadoParada]}
                        >
                          <Tooltip direction="top" className="reparto-mapa-tooltip">
                            {p.orden}. {p.nombreComprador}<br />
                            {p.items.map(it => `${it.nombreProducto} ×${Number(it.cantidad)}`).join(', ')}
                          </Tooltip>
                        </Marker>
                      ))}
                      {detalle.plan.estado === 'en_curso' && miPosicion && (
                        <Marker position={[miPosicion.lat, miPosicion.lng]} icon={ICONO_DISTRIBUIDOR}>
                          <Tooltip direction="top" className="reparto-mapa-tooltip">Tu posición</Tooltip>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                </div>
              )}

              <div className="panel-seccion-header reparto-detalle-subheader" style={{ marginBottom: 10 }}>
                <div className="panel-h1" style={{ fontSize: 16 }}>Paradas</div>
                {puedeEditar && (
                  <button type="button" className="panel-btn-nuevo" onClick={abrirModal}>
                    + Agregar pedido
                  </button>
                )}
              </div>

              {!puedeEditar && (
                <div className="panel-tabla-vacio">Este reparto está finalizado: no se puede editar.</div>
              )}

              {paradas.length === 0 && (
                <div className="panel-tabla-vacio">Este reparto todavía no tiene paradas.</div>
              )}

              {paradas.length > 0 && (
                <Tabla grid={GRID_PARADAS} className="panel-tabla-reflow">
                  <TablaHeader columnas={COLUMNAS_PARADAS} className="reparto-paradas-header" />

                  {paradas.map(p => (
                    <TablaFila key={p.id} className="reparto-paradas-fila">
                      <div className="reparto-celda">{p.orden}</div>
                      <div className="reparto-celda">#{p.pedidoId}</div>
                      <div className="reparto-celda">{p.nombreComprador}</div>
                      <div className="reparto-celda">{p.direccionEntrega}</div>
                      <div className="reparto-celda reparto-celda--centro"><EstadoBadge estado={p.estadoParada} /></div>
                      <div className="reparto-celda reparto-celda-acciones">
                        {p.latitud != null && p.longitud != null && (
                          <button
                            type="button"
                            className="reparto-btn-celda-chica"
                            onClick={() => handleVerRuta(p.latitud, p.longitud)}
                          >
                            Ver ruta
                          </button>
                        )}
                        {p.telefonoComprador && (
                          <button
                            type="button"
                            className="reparto-btn-celda-chica"
                            onClick={() => window.open(`https://wa.me/${p.telefonoComprador.replace(/^\+/, '')}`, '_blank')}
                          >
                            Mensaje
                          </button>
                        )}
                        {p.estadoParada === 'pendiente' && detalle.plan.estado === 'en_curso' && (
                          <div
                            className="reparto-estado-menu-wrapper"
                            ref={menuEstadoId === p.id ? menuEstadoRef : null}
                          >
                            <button
                              type="button"
                              className="reparto-btn-cambiar-estado"
                              disabled={marcandoId === p.id}
                              onClick={() => setMenuEstadoId(v => (v === p.id ? null : p.id))}
                            >
                              Cambiar estado
                            </button>
                            {menuEstadoId === p.id && (
                              <div className="reparto-estado-menu">
                                <button
                                  type="button"
                                  className="reparto-estado-menu-item reparto-estado-menu-item--entregado"
                                  onClick={() => handleMarcarEntregado(p)}
                                >
                                  Entregado
                                </button>
                                <button
                                  type="button"
                                  className="reparto-estado-menu-item reparto-estado-menu-item--omitido"
                                  onClick={() => abrirModalMotivo(p, 'omitido')}
                                >
                                  Omitido
                                </button>
                                <button
                                  type="button"
                                  className="reparto-estado-menu-item reparto-estado-menu-item--rechazado"
                                  onClick={() => abrirModalMotivo(p, 'rechazado')}
                                >
                                  Rechazado
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {p.estadoParada === 'pendiente' && puedeEditar && (
                          <button
                            type="button"
                            className="reparto-btn-cruz"
                            disabled={quitandoId === p.pedidoId}
                            title="Quitar del reparto"
                            onClick={() => handleQuitar(p.pedidoId)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </TablaFila>
                  ))}
                </Tabla>
              )}

              {errorEditar && (
                <div className="panel-error-visibilidad">{errorEditar}</div>
              )}

              {errorMarcar && (
                <div className="panel-error-visibilidad">{errorMarcar}</div>
              )}

              {paradas.length > 0 && (
                <div className="panel-tabla-wrapper" style={{ marginTop: 16 }}>
                  <div className="panel-seccion-header reparto-detalle-subheader" style={{ marginBottom: 0, padding: '12px 14px 0' }}>
                    <div className="panel-h1" style={{ fontSize: 16 }}>Orden de carga</div>
                  </div>
                  {[...detalle.paradas].sort((a, b) => b.orden - a.orden).map((p, i) => (
                    <div key={p.id}>
                      {i > 0 && <hr className="reparto-carga-separador" />}
                      <div className="reparto-carga-parada">
                        <div className="reparto-carga-parada-header">
                          <Avatar nombre={String(p.orden)} />
                          <div className="reparto-carga-parada-comprador">{p.nombreComprador}</div>
                        </div>
                        <div className="reparto-carga-productos">
                          {p.items.map((it, j) => (
                            <div key={j} className="reparto-carga-producto-fila">
                              {it.imagenUrl
                                ? <img src={`http://localhost:3000${it.imagenUrl}`} alt={it.nombreProducto} className="reparto-carga-producto-imagen" />
                                : <span className="reparto-carga-producto-imagen reparto-carga-producto-imagen--vacia">Sin imagen</span>
                              }
                              <span className="reparto-carga-producto-nombre">{it.nombreProducto}</span>
                              <span className="reparto-carga-cantidad">×{Number(it.cantidad)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

      {modalAbierto && (
        <Modal onCerrar={() => setModalAbierto(false)}>
          <ModalHeader titulo="Agregar pedido al reparto" onCerrar={() => setModalAbierto(false)} />
          <ModalBody>
            {cargandoDisponibles && (
              <div className="panel-tabla-vacio">Cargando pedidos...</div>
            )}

            {!cargandoDisponibles && !errorModal && disponibles.length === 0 && (
              <div className="panel-tabla-vacio">No hay pedidos prontos para repartir disponibles para agregar.</div>
            )}

            {!cargandoDisponibles && disponibles.length > 0 && disponibles.map(p => (
              <label key={p.id} className="reparto-modal-fila">
                <input
                  type="checkbox"
                  checked={seleccionModal.has(p.id)}
                  onChange={() => alternarSeleccionModal(p.id)}
                />
                <div className="reparto-modal-fila-info">
                  <div className="reparto-modal-fila-titulo">#{p.id} — {p.nombreComprador}</div>
                  <div className="reparto-modal-fila-detalle">{p.direccionEntrega}</div>
                  <div className="reparto-modal-fila-detalle">
                    {p.items.map(it => `${it.nombreProducto} ×${Number(it.cantidad)}`).join(', ')}
                  </div>
                </div>
              </label>
            ))}

            {errorModal && (
              <div className="panel-error-visibilidad">{errorModal}</div>
            )}
          </ModalBody>
          <ModalFooter>
            <Boton variante="outline" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
            <Boton disabled={seleccionModal.size === 0 || agregando} onClick={handleAgregar}>
              {agregando ? 'Agregando…' : `Agregar (${seleccionModal.size})`}
            </Boton>
          </ModalFooter>
        </Modal>
      )}

      {paradaMotivo && (
        <Modal onCerrar={() => setParadaMotivo(null)}>
          <ModalHeader
            titulo={`Marcar parada como ${paradaMotivo.accion === 'omitido' ? 'Omitida' : 'Rechazada'}`}
            onCerrar={() => setParadaMotivo(null)}
          />
          <ModalBody>
            <Campo
              area
              rows={4}
              placeholder="Motivo"
              value={motivoTexto}
              onChange={e => setMotivoTexto(e.target.value)}
            />
            {errorMotivo && (
              <div className="panel-error-visibilidad">{errorMotivo}</div>
            )}
          </ModalBody>
          <ModalFooter>
            <Boton variante="outline" onClick={() => setParadaMotivo(null)}>Cancelar</Boton>
            <Boton variante="peligro" disabled={confirmandoMotivo} onClick={handleConfirmarMotivo}>
              {confirmandoMotivo ? 'Confirmando…' : 'Confirmar'}
            </Boton>
          </ModalFooter>
        </Modal>
      )}

      {paradaEntregar && (
        <Modal onCerrar={() => setParadaEntregar(null)}>
          <ModalHeader titulo="Marcar parada como Entregada" onCerrar={() => setParadaEntregar(null)} />
          <ModalBody>
            <p className="texto-mudo" style={{ margin: 0 }}>
              ¿Marcar esta parada como Entregada? Esta acción no se puede deshacer.
            </p>
            {errorMarcar && (
              <div className="panel-error-visibilidad">{errorMarcar}</div>
            )}
          </ModalBody>
          <ModalFooter>
            <Boton variante="outline" onClick={() => setParadaEntregar(null)}>Cancelar</Boton>
            <Boton disabled={marcandoId === paradaEntregar.id} onClick={handleConfirmarEntregado}>
              {marcandoId === paradaEntregar.id ? 'Confirmando…' : 'Confirmar'}
            </Boton>
          </ModalFooter>
        </Modal>
      )}
    </PanelDistribuidor>
  )
}

export default DetalleReparto
