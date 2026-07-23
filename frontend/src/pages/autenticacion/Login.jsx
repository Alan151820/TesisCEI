import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Login.css'

function Login() {
  const [telefonoInput, setTelefonoInput] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const formatearTelefono = (valor) => {
    let numeros = valor.replace(/\D/g, '')
    if (numeros.startsWith('0')) {
      numeros = numeros.substring(1)
    }
    return '+598' + numeros
  }

  const handleLogin = async () => {
    const telefono = formatearTelefono(telefonoInput)
    try {
      const res = await axios.post('http://localhost:3000/auth/login', {
        telefono,
        contrasena
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('nombre', res.data.nombre)
      localStorage.setItem('modoDistribuidorActivo', String(res.data.modoDistribuidorActivo))
      localStorage.setItem('telefono', formatearTelefono(telefonoInput))
      navigate('/inicioComprador')
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div className="login-pagina">
      <header className="login-encabezado">
        <span className="login-logo">MarketPlace</span>

        <div className="login-buscador">
          <span className="login-buscador-icono">⌕</span>
          <input
            className="login-buscador-input"
            type="text"
            placeholder="Buscar productos…"
          />
        </div>

        <div className="login-encabezado-derecha">
          <div className="auth-tabs">
            <button type="button" className="auth-tab activo" onClick={() => navigate('/login')}>Iniciar sesión</button>
            <button type="button" className="auth-tab" onClick={() => navigate('/registro')}>Registrarse</button>
          </div>
        </div>
      </header>

      <main className="login-contenido">
        <div className="login-tarjeta">
          <h1 className="login-titulo">Iniciar sesión</h1>
          <p className="login-subtitulo">Usá tu número de teléfono y contraseña.</p>

          <div className="login-campo">
            <label className="login-etiqueta">Número de teléfono</label>
            <input
              className="login-input"
              type="text"
              placeholder="099 123 456"
              value={telefonoInput}
              onChange={e => setTelefonoInput(e.target.value)}
            />
          </div>

          <div className="login-campo">
            <div className="login-campo-encabezado">
              <label className="login-etiqueta">Contraseña</label>
              <button
                type="button"
                className="login-olvido"
                onClick={() => navigate('/recuperarContrasena')}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
            />
          </div>

          <button type="button" className="login-boton-ingresar" onClick={handleLogin}>
            Iniciar sesión
          </button>

          {mensaje && <p className="login-mensaje-error">{mensaje}</p>}

          <p className="login-pie">
            ¿No tenés cuenta? <button type="button" className="login-pie-link" onClick={() => navigate('/registro')}>Registrarse gratis</button>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login