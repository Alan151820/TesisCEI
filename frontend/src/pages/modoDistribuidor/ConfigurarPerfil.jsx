import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido, rutaInicio } from '../../lib/auth'
import './ConfigurarPerfil.css'

function ConfigurarPerfil() {
  const [nombreComercial, setNombreComercial] = useState('')
  const [descripcionNegocio, setDescripcionNegocio] = useState('')
  const [zonaEntrega, setZonaEntrega] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()
  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  const handleConfigurar = async () => {
  try {
    const res = await api.post('/distribuidor/configurarPerfil', {
      nombreComercial,
      descripcionNegocio,
      zonaEntrega
    })
    await api.post('/auth/activarModoDistribuidor')
    localStorage.setItem('distribuidorId', res.data.distribuidorId)
    localStorage.setItem('modoDistribuidorActivo', 'true')
    navigate('/inicio')
  } catch (error) {
    setMensaje(error.response?.data?.mensaje || 'No fue posible completar la operación. Intente nuevamente más tarde.')
  }
}

  return (
    <div className="configperfil-fondo">
      <div className="configperfil-card">

        <div className="configperfil-eyebrow">Paso obligatorio</div>
        <h1 className="configperfil-titulo">Configurar tu perfil de distribuidor</h1>
        <p className="configperfil-subtitulo">Completá estos datos antes de acceder al panel. Los compradores verán esta información en tu perfil público.</p>

        <div className="configperfil-campo">
          <label className="configperfil-label">Nombre comercial</label>
          <input
            className="configperfil-input"
            placeholder='Nombre comercial *'
            value={nombreComercial}
            onChange={e => setNombreComercial(e.target.value)}
          />
          <span className="configperfil-ayuda">El nombre que verán los compradores en el catálogo y en tu perfil.</span>
        </div>

        <div className="configperfil-campo">
          <label className="configperfil-label">Descripción de la distribuidora</label>
          <textarea
            className="configperfil-textarea"
            placeholder='Descripción del negocio'
            value={descripcionNegocio}
            onChange={e => setDescripcionNegocio(e.target.value)}
          />
        </div>

        <div className="configperfil-campo">
          <label className="configperfil-label">Zona de entrega</label>
          <input
            className="configperfil-input"
            placeholder='Zona de entrega'
            value={zonaEntrega}
            onChange={e => setZonaEntrega(e.target.value)}
          />
          <span className="configperfil-ayuda">Indicá las zonas geográficas donde realizás entregas.</span>
        </div>

        <div className="configperfil-acciones">
          <button className="configperfil-btn-cancelar" onClick={() => navigate(rutaInicio())}>Cancelar</button>
          <button className="configperfil-btn-guardar" onClick={handleConfigurar}>Guardar y acceder al panel</button>
        </div>

        <p className="configperfil-mensaje">{mensaje}</p>

      </div>
    </div>
  )
}

export default ConfigurarPerfil
