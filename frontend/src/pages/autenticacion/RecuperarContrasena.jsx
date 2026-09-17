import { useState } from 'react'
import { formatearTelefonoUy } from '../../lib/telefono'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import Hdr from '../../components/Hdr'
import Tarjeta from '../../components/ui/Tarjeta'
import Campo from '../../components/ui/Campo'
import Boton from '../../components/ui/Boton'
import Stepper from '../../components/ui/Stepper'
import './RecuperarContrasena.css'
import Marca from '../../components/Marca'

const PASOS = ['Teléfono', 'Código SMS', 'Nueva contraseña']

function RecuperarContrasena() {
  const [telefonoInput, setTelefonoInput] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const handleRecuperar = async () => {
    const telefono = formatearTelefonoUy(telefonoInput)
    try {
      const res = await api.post('/auth/recuperarContrasena', { telefono })
      setMensaje(res.data.mensaje)
      navigate('/verificarRecuperacion', { state: { telefono, codigoDev: res.data.codigo_dev } })
    } catch (error) {
      setMensaje(mensajeDeError(error))
    }
  }

  return (
    <div className="recuperar-pagina">
      <Hdr logo={<span className="hdr-logo" onClick={() => navigate('/')}><Marca /></span>} />

      <div className="panel-centrado">
        <Tarjeta as="main" className="auth-card col gap-m">
          <div className="titulo1">Recuperar contraseña</div>
          <p className="texto-mudo">Ingresá tu teléfono para recibir un código de verificación.</p>

          <Stepper pasos={PASOS} pasoActivo={1} />

          <div className="col gap-s">
            <span className="texto">Número de teléfono registrado</span>
            <Campo placeholder="099 123 456" value={telefonoInput} onChange={(e) => setTelefonoInput(e.target.value)} />
          </div>

          <Boton variante="fill" style={{ width: '100%' }} onClick={handleRecuperar}>
            Enviar código SMS
          </Boton>

          {mensaje && <p className="texto" style={{ color: 'var(--color-error)', textAlign: 'center', margin: 0 }}>{mensaje}</p>}

          <p className="texto-mudo" style={{ textAlign: 'center', margin: 0 }}>
            ← <button type="button" className="link" onClick={() => navigate('/login')}>Volver al inicio de sesión</button>
          </p>
        </Tarjeta>
      </div>
    </div>
  )
}

export default RecuperarContrasena
