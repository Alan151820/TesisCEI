import { useState } from 'react'
import { formatearTelefonoUy } from '../../lib/telefono'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import Hdr from '../../components/Hdr'
import TabRow from '../../components/ui/TabRow'
import Tarjeta from '../../components/ui/Tarjeta'
import Campo from '../../components/ui/Campo'
import Boton from '../../components/ui/Boton'
import './Registro.css'
import Marca from '../../components/Marca'

const AUTH_TABS = [
  { valor: 'login', etiqueta: 'Iniciar sesión' },
  { valor: 'registro', etiqueta: 'Registrarse' },
]

function Registro() {
  const [nombre, setNombre] = useState('')
  const [telefonoInput, setTelefonoInput] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [consentimientoAceptado, setConsentimientoAceptado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const handleRegistro = async () => {
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
      setMensaje(mensajeDeError(error))
    }
  }

  return (
    <div className="registro-pagina">
      <Hdr logo={<span className="hdr-logo" onClick={() => navigate('/')}><Marca /></span>}>
        <TabRow tabs={AUTH_TABS} activo="registro" onCambiar={(v) => navigate(v === 'login' ? '/login' : '/registro')} />
      </Hdr>

      <div className="panel-centrado">
        <Tarjeta as="main" className="auth-card col gap-m">
          <div className="titulo1">Crear cuenta</div>
          <p className="texto-mudo">Completá tus datos para registrarte.</p>

          <div className="col gap-s">
            <span className="texto">Nombre completo</span>
            <Campo placeholder="María García" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>

          <div className="col gap-s">
            <span className="texto">Número de teléfono</span>
            <Campo placeholder="099 123 456" value={telefonoInput} onChange={(e) => setTelefonoInput(e.target.value)} />
            <span className="texto-mudo">Se usará para verificar tu identidad y recuperar tu contraseña.</span>
          </div>

          <div className="col gap-s">
            <span className="texto">Contraseña</span>
            <Campo
              type="password"
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
            <span className="texto-mudo">Mínimo 8 caracteres.</span>
          </div>

          <label className="fila gap-s">
            <input
              type="checkbox"
              className="checkbox"
              checked={consentimientoAceptado}
              onChange={(e) => setConsentimientoAceptado(e.target.checked)}
            />
            <span className="texto-mudo">
              Acepto el tratamiento de mis datos personales (nombre, teléfono y contraseña) para crear y
              operar mi cuenta, conforme a la{' '}
              <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="link">Política de privacidad</a>.
            </span>
          </label>

          <Boton variante="fill" style={{ width: '100%' }} onClick={handleRegistro}>
            Crear cuenta
          </Boton>

          <div className="texto-mudo">
            <strong>Paso 2/2:</strong> Una vez enviado el formulario, ingresá el código de verificación que recibirás por SMS.
          </div>

          {mensaje && <p className="texto" style={{ color: 'var(--color-error)', textAlign: 'center', margin: 0 }}>{mensaje}</p>}

          <p className="texto-mudo" style={{ textAlign: 'center', margin: 0 }}>
            ¿Ya tenés cuenta? <button type="button" className="link" onClick={() => navigate('/login')}>Iniciá sesión</button>
          </p>
        </Tarjeta>
      </div>
    </div>
  )
}

export default Registro
