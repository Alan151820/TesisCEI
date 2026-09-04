import { useState } from 'react'
import ModalMapaDireccion from './ModalMapaDireccion'
import './CampoUbicacionMapa.css'

// RF-042/RF-048: campo para elegir, en un mapa interactivo, la dirección
// de partida del depósito. Se usa en dos momentos distintos (alta inicial
// del perfil en ConfigurarPerfil.jsx, y edición posterior en
// EditarPerfil.jsx) — por eso vive acá como pieza compartida en vez de
// duplicarse en cada pantalla (Guía 02, Árbol 2: dos usos reales de la
// misma lógica exacta). El estado de la dirección/coordenadas lo sigue
// llevando cada pantalla (vía `direccion` + `onSeleccionar`): este
// componente solo se ocupa de abrir el mapa y devolver lo que el usuario
// elija, nunca decide cuándo persistirlo.
function CampoUbicacionMapa({ etiqueta = 'Dirección de partida', direccion, onSeleccionar }) {
  const [mapaAbierto, setMapaAbierto] = useState(false)

  const handleConfirmar = (ubicacion) => {
    onSeleccionar(ubicacion)
    setMapaAbierto(false)
  }

  return (
    <div className="campo-ubicacion-mapa">
      <label className="campo-ubicacion-mapa-label">{etiqueta}</label>
      <div className="campo-ubicacion-mapa-fila">
        <input
          className="campo-ubicacion-mapa-input"
          placeholder="Todavía no elegiste una ubicación en el mapa."
          value={direccion || ''}
          readOnly
        />
        <button type="button" className="campo-ubicacion-mapa-boton" onClick={() => setMapaAbierto(true)}>
          Seleccionar ubicación
        </button>
      </div>

      {mapaAbierto && (
        <ModalMapaDireccion
          onConfirmar={handleConfirmar}
          onCerrar={() => setMapaAbierto(false)}
          titulo="Seleccioná la dirección de partida del depósito"
          instruccion="Tocá el mapa para colocar el pin en la dirección exacta del depósito, o arrastralo para ajustarlo."
        />
      )}
    </div>
  )
}

export default CampoUbicacionMapa
