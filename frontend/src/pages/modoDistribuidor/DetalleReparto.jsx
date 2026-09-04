import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import EstadoBadge from '../../components/EstadoBadge'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import './Inicio.css'
import './MisPedidos.css'
import './Reparto.css'

// Íconos como círculos de color (ver CrearReparto): uno por estado de
// parada, para que el mapa comunique de un vistazo qué falta y qué no.
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

// El depósito no es una parada — se marca distinto (cuadrado, no círculo)
// para que se lea de un vistazo como el punto de partida de la ruta.
const ICONO_DEPOSITO = L.divIcon({
  className: 'reparto-mapa-icono',
  html: `<span style="background:var(--color-sobre-superficie);border-radius:3px"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

// RF-072: posición propia del distribuidor durante el reparto. Círculo más
// grande y en el color de "en curso" (--color-info, mismo que usa
// EstadoBadge para "En camino"/"En curso") para distinguirlo a simple
// vista tanto del depósito (cuadrado) como de las paradas (círculos más
// chicos, uno por estado).
const ICONO_DISTRIBUIDOR = L.divIcon({
  className: 'reparto-mapa-icono',
  html: `<span style="background:var(--color-info)"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// RF-045: formatea la distancia y el tiempo total del recorrido que
// devuelve OSRM junto con la geometría de la ruta (distance en metros,
// duration en segundos) en un texto legible ("≈ 12,4 km · 25 min").
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

// RF-045: vista de progreso de un reparto — mapa con una parada por punto
// (color según su estado), lista única ordenada (RF-064 sigue viviendo acá,
// agregar/quitar pedidos pendientes) y barra de progreso. Marcar una parada
// como Entregada/Omitida/Rechazada (RF-046) también vive acá, disponible
// solo con el reparto "En curso". Eliminar (RF-065) y cerrar en bloque
// (RF-067) se manejan desde el panel (la cruz de cada fila), no acá.
function DetalleReparto() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [errorEditar, setErrorEditar] = useState('')
  const [quitandoId, setQuitandoId] = useState(null)

  // RF-064: agregar pedidos vía modal, en vez de listarlos todos ya
  // seleccionables en la pantalla principal.
  const [modalAbierto, setModalAbierto] = useState(false)
  const [disponibles, setDisponibles] = useState([])
  const [cargandoDisponibles, setCargandoDisponibles] = useState(false)
  const [errorModal, setErrorModal] = useState('')
  const [seleccionModal, setSeleccionModal] = useState(new Set())
  const [agregando, setAgregando] = useState(false)

  const [iniciando, setIniciando] = useState(false)
  const [errorIniciar, setErrorIniciar] = useState('')

  // RF-046: marcar una parada pendiente como Entregada, Omitida o
  // Rechazada. Entregado se confirma en el momento (sin datos que pedir);
  // Omitido y Rechazada abren el mismo modal de motivo (paradaMotivo guarda
  // cuál de las dos, para armar el título y el POST correcto).
  const [marcandoId, setMarcandoId] = useState(null)
  const [errorMarcar, setErrorMarcar] = useState('')
  const [paradaMotivo, setParadaMotivo] = useState(null)
  const [motivoTexto, setMotivoTexto] = useState('')
  const [confirmandoMotivo, setConfirmandoMotivo] = useState(false)
  const [errorMotivo, setErrorMotivo] = useState('')

  // El botón "Cambiar estado" abre un menú con las tres acciones (RF-046);
  // elegir una lo cierra y vuelve a mostrar "Cambiar estado".
  const [menuEstadoId, setMenuEstadoId] = useState(null)
  const menuEstadoRef = useRef(null)

  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

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
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }, [id])

  useEffect(() => { cargarDetalle() }, [cargarDetalle])

  const pedidosIncluidos = (detalle?.paradas || []).filter(p => p.estadoParada === 'pendiente')
  const pedidosIncluidosIds = pedidosIncluidos.map(p => p.pedidoId)

  const guardarPedidos = (idsDeseados) =>
    api.put(`/api/reparto/${id}/pedidos`, { pedidoIds: idsDeseados }).then(() => cargarDetalle())

  // RF-064: quitar un pedido pendiente del reparto.
  const handleQuitar = async (pedidoId) => {
    setErrorEditar('')
    setQuitandoId(pedidoId)
    try {
      await guardarPedidos(pedidosIncluidosIds.filter(pid => pid !== pedidoId))
    } catch (err) {
      setErrorEditar(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
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
      .catch(err => setErrorModal(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
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

  // RF-064: agrega al reparto los pedidos elegidos en el modal.
  const handleAgregar = async () => {
    setErrorModal('')
    setAgregando(true)
    try {
      await guardarPedidos([...pedidosIncluidosIds, ...seleccionModal])
      setModalAbierto(false)
    } catch (err) {
      setErrorModal(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setAgregando(false)
    }
  }

  // RF-066: pasa el reparto de "Sin empezar" a "En curso".
  const handleIniciar = async () => {
    setErrorIniciar('')
    setIniciando(true)
    try {
      await api.post(`/api/reparto/${id}/iniciar`)
      cargarDetalle()
    } catch (err) {
      setErrorIniciar(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setIniciando(false)
    }
  }

  const marcarParada = (paradaId, accion, motivo) =>
    api.post(`/api/reparto/${id}/paradas/${paradaId}/marcar`, { accion, motivo })

  // RF-046: marca una parada como Entregada. Es irreversible y actualiza el
  // pedido en el sistema principal, así que pide confirmación antes.
  const handleMarcarEntregado = async (parada) => {
    setMenuEstadoId(null)
    if (!window.confirm('¿Marcar esta parada como Entregada? Esta acción no se puede deshacer.')) return
    setErrorMarcar('')
    setMarcandoId(parada.id)
    try {
      await marcarParada(parada.id, 'entregado')
      cargarDetalle()
    } catch (err) {
      setErrorMarcar(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setMarcandoId(null)
    }
  }

  const abrirModalMotivo = (parada, accion) => {
    setMenuEstadoId(null)
    setParadaMotivo({ parada, accion })
    setMotivoTexto('')
    setErrorMotivo('')
  }

  // RF-046: confirma Omitido o Rechazado (ambos requieren motivo).
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
      setErrorMotivo(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
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

  // RF-045: ruta real por calles sobre el mapa — servicio /route/ del
  // servidor público de demo de OSRM (gratuito, sin API key), uniendo el
  // depósito con cada parada en el orden ya calculado (RF-044): esto solo
  // dibuja el camino, nunca recalcula ni reordena. Si OSRM no responde, el
  // mapa se queda solo con los puntos (comportamiento de antes) — no tiene
  // sentido bloquear la pantalla por un tercero gratuito sin garantía de
  // disponibilidad. La misma respuesta ya trae distance/duration del
  // recorrido completo, así que se aprovecha esa misma llamada para el
  // resumen aproximado ("≈ X km · Y min") en vez de pedirle a OSRM un
  // segundo cálculo aparte.
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

  // RF-071: mientras el reparto está "En curso", comparte la posición del
  // celular del distribuidor para que el comprador la vea en vivo en su
  // propio pedido (DetallePedido). Si el navegador no tiene geolocalización
  // o el distribuidor no da el permiso, no se muestra ningún error acá —
  // el reparto se sigue manejando igual, el comprador simplemente no ve la
  // posición en vivo. El throttle de 8s evita mandar un PATCH por cada
  // disparo de watchPosition (puede ser varios por segundo en movimiento).
  // RF-072: el mismo watchPosition alimenta también el estado local
  // miPosicion, sin throttle (es solo para pintar el mapa propio, no pega
  // contra el servidor) — así el distribuidor ve su propia posición en el
  // mapa de este mismo reparto, sin depender de una consulta aparte.
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
    <PanelDistribuidor tituloMobile={`Reparto #${id}`} activo="/reparto">
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
                <div className="panel-tabla-wrapper">
                  <div className="reparto-paradas-header">
                    <div>N°</div>
                    <div>Pedido</div>
                    <div>Comprador</div>
                    <div>Dirección</div>
                    <div>Estado</div>
                    <div>Acciones</div>
                  </div>

                  {paradas.map(p => (
                    <div key={p.id} className="reparto-paradas-fila">
                      <div className="reparto-celda">{p.orden}</div>
                      <div className="reparto-celda">#{p.pedidoId}</div>
                      <div className="reparto-celda">{p.nombreComprador}</div>
                      <div className="reparto-celda">{p.direccionEntrega}</div>
                      <div className="reparto-celda"><EstadoBadge estado={p.estadoParada} /></div>
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
                    </div>
                  ))}
                </div>
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
                  {detalle.paradas.map((p, i) => (
                    <div key={p.id}>
                      {i > 0 && <hr className="reparto-carga-separador" />}
                      <div className="reparto-carga-parada">
                        <div className="reparto-carga-parada-header">
                          <span className="reparto-carga-parada-orden">{i + 1}</span>
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
        <div className="reparto-modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="reparto-modal" onClick={e => e.stopPropagation()}>
            <div className="reparto-modal-header">
              <div className="reparto-modal-titulo">Agregar pedido al reparto</div>
              <button type="button" className="reparto-modal-cerrar" onClick={() => setModalAbierto(false)}>✕</button>
            </div>

            <div className="reparto-modal-body">
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
            </div>

            <div className="reparto-modal-footer">
              <button type="button" className="reparto-btn-volver" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button
                type="button"
                className="panel-btn-nuevo"
                disabled={seleccionModal.size === 0 || agregando}
                onClick={handleAgregar}
              >
                {agregando ? 'Agregando…' : `Agregar (${seleccionModal.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {paradaMotivo && (
        <div className="reparto-modal-overlay" onClick={() => setParadaMotivo(null)}>
          <div className="reparto-modal" onClick={e => e.stopPropagation()}>
            <div className="reparto-modal-header">
              <div className="reparto-modal-titulo">
                Marcar parada como {paradaMotivo.accion === 'omitido' ? 'Omitida' : 'Rechazada'}
              </div>
              <button type="button" className="reparto-modal-cerrar" onClick={() => setParadaMotivo(null)}>✕</button>
            </div>

            <div className="reparto-modal-body">
              <textarea
                className="reparto-modal-textarea"
                rows={4}
                placeholder="Motivo"
                value={motivoTexto}
                onChange={e => setMotivoTexto(e.target.value)}
              />
              {errorMotivo && (
                <div className="panel-error-visibilidad">{errorMotivo}</div>
              )}
            </div>

            <div className="reparto-modal-footer">
              <button type="button" className="reparto-btn-volver" onClick={() => setParadaMotivo(null)}>Cancelar</button>
              <button
                type="button"
                className="pedidos-accion-btn pedidos-accion-btn--peligro"
                style={{ width: 'auto' }}
                disabled={confirmandoMotivo}
                onClick={handleConfirmarMotivo}
              >
                {confirmandoMotivo ? 'Confirmando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelDistribuidor>
  )
}

export default DetalleReparto
