import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { mensajeDeError } from '../../lib/errores'
import Hdr from '../../components/Hdr'
import TabRow from '../../components/ui/TabRow'
import Tarjeta from '../../components/ui/Tarjeta'
import Campo from '../../components/ui/Campo'
import Boton from '../../components/ui/Boton'
import './Verificar.css'
import Marca from '../../components/Marca'

const AUTH_TABS = [
  { valor: 'login', etiqueta: 'Iniciar sesión' },
  { valor: 'registro', etiqueta: 'Registrarse' },
]

function Verificar() {
  const [codigo, setCodigo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const telefono = location.state?.telefono
  const nombre = location.state?.nombre
  const codigoDev = location.state?.codigoDev

  const handleVerificar = async () => {
    try {
      const res = await api.post('/auth/verificar', {
        telefono,
        codigo
      })
      localStorage.setItem('telefono', telefono)
      localStorage.setItem('nombre', res.data.nombre || nombre)
      localStorage.setItem('modoDistribuidorActivo', 'false')
      localStorage.setItem('token', res.data.token)
      window.dispatchEvent(new Event('auth-changed'))
      navigate('/inicioComprador')
    } catch (error) {
      setMensaje(mensajeDeError(error))
    }
  }

  return (
    <div className="verificar-pagina">
      <Hdr logo={<span className="hdr-logo" onClick={() => navigate('/')}><Marca /></span>} buscador>
        <TabRow tabs={AUTH_TABS} activo="registro" onCambiar={(v) => navigate(v === 'login' ? '/login' : '/registro')} />
      </Hdr>

      <div className="panel-centrado">
        <Tarjeta as="main" className="auth-card col gap-m">
          <div className="titulo1">Verificar cuenta</div>
          <p className="texto-mudo">Ingresá el código que te enviamos al {telefono}</p>

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

export default Verificar
