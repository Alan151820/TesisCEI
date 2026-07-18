import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import './NuevaContrasena.css'

function NuevaContrasena() {
  const [contrasena, setContrasena] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const telefono = location.state?.telefono

  const handleNuevaContrasena = async () => {
    if (contrasena !== confirmar) {
      setMensaje('Las contraseñas no coinciden.')
      return
    }
    try {
      const res = await axios.post('http://localhost:3000/auth/nuevaContrasena', { telefono, contrasena })
      setMensaje(res.data.mensaje)
      navigate('/login')
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div className="nuevacontrasena-pagina">
      <header className="nuevacontrasena-encabezado">
        <span className="nuevacontrasena-logo">MarketPlace</span>

        <div className="nuevacontrasena-buscador">
          <span className="nuevacontrasena-buscador-icono">⌕</span>
          <span className="nuevacontrasena-buscador-texto">Buscar productos…</span>
        </div>

        <div className="nuevacontrasena-encabezado-derecha">
          <span className="nuevacontrasena-encabezado-link">Iniciar sesión</span>
          <button type="button" className="nuevacontrasena-encabezado-boton">Registrarse</button>
        </div>
      </header>

      <main className="nuevacontrasena-contenido">
        <div className="nuevacontrasena-tarjeta">
          <h1 className="nuevacontrasena-titulo">Nueva contraseña</h1>
          <p className="nuevacontrasena-subtitulo">Elegí una nueva contraseña para tu cuenta.</p>

          <div className="nuevacontrasena-stepper">
            <div className="nuevacontrasena-paso nuevacontrasena-paso-activo">
              <span className="nuevacontrasena-paso-numero">1</span>
              <span className="nuevacontrasena-paso-texto">Teléfono</span>
            </div>
            <div className="nuevacontrasena-paso nuevacontrasena-paso-activo">
              <span className="nuevacontrasena-paso-numero">2</span>
              <span className="nuevacontrasena-paso-texto">Código SMS</span>
            </div>
            <div className="nuevacontrasena-paso nuevacontrasena-paso-activo">
              <span className="nuevacontrasena-paso-numero">3</span>
              <span className="nuevacontrasena-paso-texto">Nueva contraseña</span>
            </div>
          </div>

          <div className="nuevacontrasena-campo">
            <label className="nuevacontrasena-etiqueta">Nueva contraseña</label>
            <input
              className="nuevacontrasena-input"
              type="password"
              placeholder="Nueva contraseña"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
            />
          </div>

          <div className="nuevacontrasena-campo">
            <label className="nuevacontrasena-etiqueta">Confirmar contraseña</label>
            <input
              className="nuevacontrasena-input"
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="nuevacontrasena-boton"
            onClick={handleNuevaContrasena}
          >
            Guardar
          </button>

          {mensaje && <p className="nuevacontrasena-mensaje-error">{mensaje}</p>}
        </div>
      </main>
    </div>
  )
}

export default NuevaContrasena
