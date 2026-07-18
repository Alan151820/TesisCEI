import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import './VerificarRecuperacion.css'

function VerificarRecuperacion() {
  const [codigo, setCodigo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const telefono = location.state?.telefono
  const codigoDev = location.state?.codigoDev

  const handleVerificar = async () => {
    try {
      const res = await axios.post('http://localhost:3000/auth/verificarRecuperacion', { telefono, codigo })
      setMensaje(res.data.mensaje)
      navigate('/nuevaContrasena', { state: { telefono } })
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div className="verificarrecuperacion-pagina">
      <header className="verificarrecuperacion-encabezado">
        <span className="verificarrecuperacion-logo">MarketPlace</span>

        <div className="verificarrecuperacion-buscador">
          <span className="verificarrecuperacion-buscador-icono">⌕</span>
          <span className="verificarrecuperacion-buscador-texto">Buscar productos…</span>
        </div>

        <div className="verificarrecuperacion-encabezado-derecha">
          <span className="verificarrecuperacion-encabezado-link">Iniciar sesión</span>
          <button type="button" className="verificarrecuperacion-encabezado-boton">Registrarse</button>
        </div>
      </header>

      <main className="verificarrecuperacion-contenido">
        <div className="verificarrecuperacion-tarjeta">
          <h1 className="verificarrecuperacion-titulo">Verificar código</h1>
          <p className="verificarrecuperacion-subtitulo">Ingresá el código que te enviamos al {telefono}</p>

          <div className="verificarrecuperacion-stepper">
            <div className="verificarrecuperacion-paso verificarrecuperacion-paso-activo">
              <span className="verificarrecuperacion-paso-numero">1</span>
              <span className="verificarrecuperacion-paso-texto">Teléfono</span>
            </div>
            <div className="verificarrecuperacion-paso verificarrecuperacion-paso-activo">
              <span className="verificarrecuperacion-paso-numero">2</span>
              <span className="verificarrecuperacion-paso-texto">Código SMS</span>
            </div>
            <div className="verificarrecuperacion-paso">
              <span className="verificarrecuperacion-paso-numero">3</span>
              <span className="verificarrecuperacion-paso-texto">Nueva contraseña</span>
            </div>
          </div>

          {codigoDev && <p className="verificarrecuperacion-codigo-dev">Código de desarrollo: {codigoDev}</p>}

          <div className="verificarrecuperacion-campo">
            <label className="verificarrecuperacion-etiqueta">Código de verificación</label>
            <input
              className="verificarrecuperacion-input"
              placeholder="Código de 6 dígitos"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="verificarrecuperacion-boton"
            onClick={handleVerificar}
          >
            Verificar
          </button>

          {mensaje && <p className="verificarrecuperacion-mensaje-error">{mensaje}</p>}
        </div>
      </main>
    </div>
  )
}

export default VerificarRecuperacion
