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
import './Login.css'
import Marca from '../../components/Marca'

const AUTH_TABS = [
  { valor: 'login', etiqueta: 'Iniciar sesión' },
  { valor: 'registro', etiqueta: 'Registrarse' },
]

function Login() {
  const [telefonoInput, setTelefonoInput] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const handleLogin = async () => {
    const telefono = formatearTelefonoUy(telefonoInput)
    try {
      const res = await api.post('/auth/login', {
        telefono,
        contrasena
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('nombre', res.data.nombre)
      localStorage.setItem('modoDistribuidorActivo', String(res.data.modoDistribuidorActivo))
      localStorage.setItem('telefono', formatearTelefonoUy(telefonoInput))
      window.dispatchEvent(new Event('auth-changed'))
      navigate('/inicioComprador')
    } catch (error) {
      setMensaje(mensajeDeError(error))
    }
  }

  return (
    <div className="login-pagina">
      <Hdr logo={<span className="hdr-logo" onClick={() => navigate('/')}><Marca /></span>}>
        <TabRow tabs={AUTH_TABS} activo="login" onCambiar={(v) => navigate(v === 'login' ? '/login' : '/registro')} />
      </Hdr>

      <div className="panel-centrado">
        <Tarjeta as="main" className="auth-card col gap-m">
          <div className="titulo1">Iniciar sesión</div>
          <p className="texto-mudo">Usá tu número de teléfono y contraseña.</p>

          <div className="col gap-s">
            <span className="texto">Teléfono</span>
            <Campo
              type="text"
              placeholder="099 123 456"
              value={telefonoInput}
              onChange={(e) => setTelefonoInput(e.target.value)}
            />
          </div>

          <div className="col gap-s">
            <span className="texto">Contraseña</span>
            <Campo
              type="password"
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </div>

          <button type="button" className="link" onClick={() => navigate('/recuperarContrasena')} style={{ alignSelf: 'flex-start' }}>
            ¿Olvidaste tu contraseña?
          </button>

          <Boton variante="fill" style={{ width: '100%' }} onClick={handleLogin}>
            Iniciar sesión
          </Boton>

          {mensaje && <p className="texto" style={{ color: 'var(--color-error)', textAlign: 'center', margin: 0 }}>{mensaje}</p>}

          <p className="texto-mudo" style={{ textAlign: 'center', margin: 0 }}>
            ¿No tenés cuenta? <button type="button" className="link" onClick={() => navigate('/registro')}>Registrarse gratis</button>
          </p>
        </Tarjeta>
      </div>
    </div>
  )
}

export default Login
