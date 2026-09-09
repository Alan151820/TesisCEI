import { useState } from 'react'
import { formatearTelefonoUy } from '../../lib/telefono'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import './Registro.css'

function Registro() {
  const [nombre, setNombre] = useState('')
  const [telefonoInput, setTelefonoInput] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [consentimientoAceptado, setConsentimientoAceptado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const handleRegistro = async () => {
    // RNF-010 (Ley 18.331): feedback rápido en el cliente — el servidor
    // vuelve a exigirlo igual, esto es solo para no hacer el viaje al
    // servidor si ya se sabe que va a fallar.
    if (!consentimientoAceptado) {
      setMensaje('Debés aceptar el tratamiento de datos personales para continuar.')
      return
    }
    const telefono = formatearTelefonoUy(telefonoInput)
    try {
      const res = await api.post('/auth/registro', {
        nombre,
        telefono,
        contrasena,
        consentimientoDatosOtorgado: consentimientoAceptado
      })
      setMensaje(res.data.mensaje)
      navigate('/verificar', { state: { telefono, nombre, codigoDev: res.data.codigo_dev } })
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div className="registro-pagina">
      <header className="registro-encabezado">
        <span className="registro-logo">MarketPlace</span>
        
        <div className="login-encabezado-derecha">
          <div className="auth-tabs">
            <button type="button" className="auth-tab" onClick={() => navigate('/login')}>Iniciar sesión</button>
            <button type="button" className="auth-tab activo">Registrarse</button>
          </div>
        </div>
      </header>

      <main className="registro-contenido">
        <div className="registro-tarjeta">
          <h1 className="registro-titulo">Crear cuenta</h1>
          <p className="registro-subtitulo">Completá tus datos para registrarte.</p>

          <div className="registro-campo">
            <label className="registro-etiqueta">Nombre completo</label>
            <input
              className="registro-input"
              placeholder="María García"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
          </div>

          <div className="registro-campo">
            <label className="registro-etiqueta">Número de teléfono</label>
            <input
              className="registro-input"
              placeholder="099 123 456"
              value={telefonoInput}
              onChange={e => setTelefonoInput(e.target.value)}
            />
            <span className="registro-ayuda">Se usará para verificar tu identidad y recuperar tu contraseña.</span>
          </div>

          <div className="registro-campo">
            <label className="registro-etiqueta">Contraseña</label>
            <input
              className="registro-input"
              type="password"
              placeholder="••••••••"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
            />
            <span className="registro-ayuda">Mínimo 8 caracteres.</span>
          </div>

          <label className="registro-consentimiento">
            <input
              type="checkbox"
              className="registro-checkbox"
              checked={consentimientoAceptado}
              onChange={e => setConsentimientoAceptado(e.target.checked)}
            />
            <span className="registro-consentimiento-texto">
              Acepto el tratamiento de mis datos personales (nombre, teléfono y contraseña) para crear y
              operar mi cuenta, conforme a la{' '}
              <a href="/privacidad" target="_blank" rel="noopener noreferrer">Política de privacidad</a>.
            </span>
          </label>

          <button
            type="button"
            className="registro-boton-crear"
            onClick={handleRegistro}
          >
            Crear cuenta
          </button>

          <div className="registro-paso-info">
            <strong>Paso 2/2:</strong> Una vez enviado el formulario, ingresá el código de verificación que recibirás por SMS.
          </div>

          {mensaje && <p className="registro-mensaje-error">{mensaje}</p>}

          <p className="registro-pie">
            ¿Ya tenés cuenta? <button type="button" className="registro-pie-link">Iniciá sesión</button>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Registro
