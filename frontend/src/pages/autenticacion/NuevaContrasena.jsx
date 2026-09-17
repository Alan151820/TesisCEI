import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../lib/axios'
import { mensajeDeError } from '../../lib/errores'
import Hdr from '../../components/Hdr'
import Tarjeta from '../../components/ui/Tarjeta'
import Campo from '../../components/ui/Campo'
import Boton from '../../components/ui/Boton'
import Stepper from '../../components/ui/Stepper'
import './NuevaContrasena.css'
import Marca from '../../components/Marca'

const PASOS = ['Teléfono', 'Código SMS', 'Nueva contraseña']

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
      const res = await api.post('/auth/nuevaContrasena', { telefono, contrasena })
      setMensaje(res.data.mensaje)
      navigate('/login')
    } catch (error) {
      setMensaje(mensajeDeError(error))
    }
  }

  return (
    <div className="nuevacontrasena-pagina">
      <Hdr logo={<span className="hdr-logo" onClick={() => navigate('/')}><Marca /></span>} />

      <div className="panel-centrado">
        <Tarjeta as="main" className="auth-card col gap-m">
          <div className="titulo1">Nueva contraseña</div>
          <p className="texto-mudo">Elegí una nueva contraseña para tu cuenta.</p>

          <Stepper pasos={PASOS} pasoActivo={3} />

          <div className="col gap-s">
            <span className="texto">Nueva contraseña</span>
            <Campo
              type="password"
              placeholder="Nueva contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </div>

          <div className="col gap-s">
            <span className="texto">Confirmar contraseña</span>
            <Campo
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
            />
          </div>

          <Boton variante="fill" style={{ width: '100%' }} onClick={handleNuevaContrasena}>
            Guardar
          </Boton>

          {mensaje && <p className="texto" style={{ color: 'var(--color-error)', textAlign: 'center', margin: 0 }}>{mensaje}</p>}
        </Tarjeta>
      </div>
    </div>
  )
}

export default NuevaContrasena
