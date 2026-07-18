import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './RecuperarContrasena.css'

function RecuperarContrasena() {
  const [telefonoInput, setTelefonoInput] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const formatearTelefono = (valor) => {
    let numeros = valor.replace(/\D/g, '')
    if (numeros.startsWith('0')) {
      numeros = numeros.substring(1)
    }
    return '+598' + numeros
  }

  const handleRecuperar = async () => {
    const telefono = formatearTelefono(telefonoInput)
    try {
      const res = await axios.post('http://localhost:3000/auth/recuperarContrasena', { telefono })
      setMensaje(res.data.mensaje)
      navigate('/verificarRecuperacion', { state: { telefono, codigoDev: res.data.codigo_dev } })
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div className="recuperar-pagina">
      <header className="recuperar-encabezado">
        <span className="recuperar-logo">MarketPlace</span>

        <div className="recuperar-buscador">
          <span className="recuperar-buscador-icono">⌕</span>
          <span className="recuperar-buscador-texto">Buscar productos…</span>
        </div>

        <div className="recuperar-encabezado-derecha">
          <span className="recuperar-encabezado-link">Iniciar sesión</span>
          <button type="button" className="recuperar-encabezado-boton">Registrarse</button>
        </div>
      </header>

      <main className="recuperar-contenido">
        <div className="recuperar-tarjeta">
          <h1 className="recuperar-titulo">Recuperar contraseña</h1>
          <p className="recuperar-subtitulo">Ingresá tu teléfono para recibir un código de verificación.</p>

          <div className="recuperar-stepper">
            <div className="recuperar-paso recuperar-paso-activo">
              <span className="recuperar-paso-numero">1</span>
              <span className="recuperar-paso-texto">Teléfono</span>
            </div>
            <div className="recuperar-paso">
              <span className="recuperar-paso-numero">2</span>
              <span className="recuperar-paso-texto">Código SMS</span>
            </div>
            <div className="recuperar-paso">
              <span className="recuperar-paso-numero">3</span>
              <span className="recuperar-paso-texto">Nueva contraseña</span>
            </div>
          </div>

          <div className="recuperar-campo">
            <label className="recuperar-etiqueta">Número de teléfono registrado</label>
            <input
              className="recuperar-input"
              placeholder="099 123 456"
              value={telefonoInput}
              onChange={e => setTelefonoInput(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="recuperar-boton"
            onClick={handleRecuperar}
          >
            Enviar código SMS
          </button>

          {mensaje && <p className="recuperar-mensaje-error">{mensaje}</p>}

          <p className="recuperar-pie">
            ← <button type="button" className="recuperar-pie-link">Volver al inicio de sesión</button>
          </p>
        </div>
      </main>
    </div>
  )
}

export default RecuperarContrasena
