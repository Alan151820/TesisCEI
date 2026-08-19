import { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './ModalMapaDireccion.css'

// Fix de íconos de marcador en Vite (leaflet usa require() internamente)
import markerIconPng from 'leaflet/dist/images/marker-icon.png'
import markerIcon2xPng from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIconPng,
  iconRetinaUrl: markerIcon2xPng,
  shadowUrl: markerShadowPng,
})

const MONTEVIDEO = [-34.9011, -56.1645]
const ZOOM_INICIAL = 13
const ZOOM_UBICACION = 16

async function fetchDireccion(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`
  const res = await fetch(url, { headers: { 'User-Agent': 'TesisCEI-Marketplace/1.0' } })
  if (!res.ok) throw new Error('error nominatim')
  const data = await res.json()
  return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

// Componente interno: vuela al centro cuando cambia (necesario porque MapContainer no re-renderiza)
function ControladorCentro({ centro, zoom }) {
  const map = useMap()
  const primero = useRef(true)
  useEffect(() => {
    if (primero.current) { primero.current = false; return }
    map.flyTo(centro, zoom, { duration: 0.7 })
  }, [centro, zoom, map])
  return null
}

// Componente interno: captura clicks en el mapa
function ManejadorClic({ onClic }) {
  useMapEvents({ click: e => onClic(e.latlng.lat, e.latlng.lng) })
  return null
}

// soloLectura: modo de solo visualización, usado para mostrar la ubicación
// exacta de un pedido ya confirmado — sin edición, sin click-to-move.
function ModalMapaDireccion({ onConfirmar, onCerrar, soloLectura = false, ubicacionInicial = null, direccionInicial = '' }) {
  const [marcador, setMarcador] = useState(soloLectura && ubicacionInicial ? ubicacionInicial : null)
  const [centro, setCentro] = useState(soloLectura && ubicacionInicial ? [ubicacionInicial.lat, ubicacionInicial.lng] : MONTEVIDEO)
  const [zoom, setZoom] = useState(soloLectura && ubicacionInicial ? ZOOM_UBICACION : ZOOM_INICIAL)
  const [direccionTexto, setDireccionTexto] = useState(soloLectura ? direccionInicial : '')
  const [geocodificando, setGeocodificando] = useState(false)
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false)
  const [errorUbicacion, setErrorUbicacion] = useState('')

  const ponerMarcador = useCallback(async (lat, lng) => {
    setMarcador({ lat, lng })
    setGeocodificando(true)
    try {
      const dir = await fetchDireccion(lat, lng)
      setDireccionTexto(dir)
    } catch {
      setDireccionTexto(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally {
      setGeocodificando(false)
    }
  }, [])

  const usarUbicacionActual = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorUbicacion('Tu navegador no soporta geolocalización.')
      return
    }
    setBuscandoUbicacion(true)
    setErrorUbicacion('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCentro([lat, lng])
        setZoom(ZOOM_UBICACION)
        ponerMarcador(lat, lng)
        setBuscandoUbicacion(false)
      },
      () => {
        setErrorUbicacion('No se pudo obtener tu ubicación. Tocá el mapa para indicar la dirección.')
        setBuscandoUbicacion(false)
      },
      { timeout: 8000 }
    )
  }, [ponerMarcador])

  const handleConfirmar = () => {
    if (!marcador || !direccionTexto || geocodificando) return
    onConfirmar({ lat: marcador.lat, lng: marcador.lng, direccion: direccionTexto })
  }

  return (
    <div className="mapa-overlay" onClick={onCerrar}>
      <div className="mapa-modal" onClick={e => e.stopPropagation()}>

        <div className="mapa-header">
          <div className="mapa-titulo">{soloLectura ? 'Ubicación de entrega' : 'Seleccioná tu dirección de entrega'}</div>
          <button className="mapa-cerrar" onClick={onCerrar}>✕</button>
        </div>

        {!soloLectura && (
          <div className="mapa-instruccion">
            Tocá el mapa para colocar el pin en la dirección exacta de entrega, o arrastralo para ajustarlo.
          </div>
        )}

        {!soloLectura && (
          <div className="mapa-ubicacion-btn-wrap">
            <button
              className="mapa-btn-ubicacion"
              onClick={usarUbicacionActual}
              disabled={buscandoUbicacion}
            >
              {buscandoUbicacion ? 'Obteniendo ubicación...' : '📍 Usar mi ubicación actual'}
            </button>
            {errorUbicacion && <div className="mapa-error-ubicacion">{errorUbicacion}</div>}
          </div>
        )}

        <div className="mapa-contenedor">
          <MapContainer
            center={centro}
            zoom={zoom}
            className="mapa-leaflet"
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <ControladorCentro centro={centro} zoom={zoom} />
            {!soloLectura && <ManejadorClic onClic={ponerMarcador} />}
            {marcador && (
              <Marker
                position={[marcador.lat, marcador.lng]}
                draggable={!soloLectura}
                eventHandlers={soloLectura ? {} : {
                  dragend: e => {
                    const pos = e.target.getLatLng()
                    ponerMarcador(pos.lat, pos.lng)
                  },
                }}
              />
            )}
          </MapContainer>
        </div>

        {geocodificando ? (
          <div className="mapa-direccion-placeholder">Buscando dirección...</div>
        ) : direccionTexto ? (
          <div className="mapa-direccion-seleccionada">
            <span className="mapa-direccion-icono">📍</span>
            <span className="mapa-direccion-texto">{direccionTexto}</span>
          </div>
        ) : (
          <div className="mapa-direccion-placeholder">Tocá el mapa para seleccionar una ubicación</div>
        )}

        <div className="mapa-footer">
          {soloLectura ? (
            <button className="mapa-btn-confirmar" onClick={onCerrar}>Cerrar</button>
          ) : (
            <>
              <button className="mapa-btn-cancelar" onClick={onCerrar}>Cancelar</button>
              <button
                className="mapa-btn-confirmar"
                onClick={handleConfirmar}
                disabled={!marcador || !direccionTexto || geocodificando}
              >
                Confirmar ubicación
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

export default ModalMapaDireccion
