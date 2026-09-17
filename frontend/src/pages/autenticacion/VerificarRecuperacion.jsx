import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../lib/axios'
import { mensajeDeError } from '../../lib/errores'
import Hdr from '../../components/Hdr'
import Tarjeta from '../../components/ui/Tarjeta'
import Campo from '../../components/ui/Campo'
import Boton from '../../components/ui/Boton'
import Stepper from '../../components/ui/Stepper'
import './VerificarRecuperacion.css'
import Marca from '../../components/Marca'

const PASOS = ['Teléfono', 'Código SMS', 'Nueva contraseña']

function VerificarRecuperacion() {
  const [codigo, setCodigo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const telefono = location.state?.telefono
  const codigoDev = location.state?.codigoDev

  const handleVerificar = async () => {
    try {
      const res = await api.post('/auth/verificarRecuperacion', { telefono, codigo })
      setMensaje(res.data.mensaje)
      navigate('/nuevaContrasena', { state: { telefono } })
    } catch (error) {
      setMensaje(mensajeDeError(error))
    }
  }

  return (
    <div className="verificarrecuperacion-pagina">
      <Hdr logo={<span className="hdr-logo" onClick={() => navigate('/')}><Marca /></span>} />

      <div className="panel-centrado">
        <Tarjeta as="main" className="auth-card col gap-m">
          <div className="titulo1">Verificar código</div>
          <p className="texto-mudo">Ingresá el código que te enviamos al {telefono}</p>

          <Stepper pasos={PASOS} pasoActivo={2} />

          {codigoDev && <p className="texto-mudo">Código de desarrollo: {codigoDev}</p>}

          <div className="col gap-s">
            <span className="texto">Código de verificación</span>
            <Campo placeholder="Código de 6 dígitos" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>

          <Boton variante="fill" style={{ width: '100%' }} onClick={handleVerificar}>
            Verificar
          </Boton>

          {mensaje && <p className="texto" style={{ color: 'var(--color-error)', textAlign: 'center', margin: 0 }}>{mensaje}</p>}
        </Tarjeta>
      </div>
    </div>
  )
}

export default VerificarRecuperacion
