import { useState } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { rutaInicio } from '../../lib/auth'
import CampoUbicacionMapa from '../../components/CampoUbicacionMapa'
import Hdr from '../../components/Hdr'
import Tarjeta from '../../components/ui/Tarjeta'
import Campo from '../../components/ui/Campo'
import Boton from '../../components/ui/Boton'
import './ConfigurarPerfil.css'
import Marca from '../../components/Marca'

function ConfigurarPerfil() {
  const [nombreComercial, setNombreComercial] = useState('')
  const [descripcionNegocio, setDescripcionNegocio] = useState('')
  const [zonaEntrega, setZonaEntrega] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const [direccionPartida, setDireccionPartida] = useState('')
  const [latitudPartida, setLatitudPartida] = useState(null)
  const [longitudPartida, setLongitudPartida] = useState(null)

  const handleConfigurar = async () => {
    try {
      const res = await api.post('/distribuidor/configurarPerfil', {
        nombreComercial,
        descripcionNegocio,
        zonaEntrega,
        direccionPartida: direccionPartida || null,
        latitud: latitudPartida,
        longitud: longitudPartida,
      })
      await api.post('/auth/activarModoDistribuidor')
      localStorage.setItem('distribuidorId', res.data.distribuidorId)
      localStorage.setItem('modoDistribuidorActivo', 'true')
      navigate('/inicio')
    } catch (error) {
      setMensaje(mensajeDeError(error))
    }
  }

  return (
    <div className="configperfil-fondo">
      <Hdr logo={<span className="hdr-logo"><Marca /></span>} />

      <div className="p-l">
        <Tarjeta className="col gap-m configperfil-card">
          <span className="texto-mudo">Paso obligatorio</span>
          <div className="titulo1">Configurar tu perfil de distribuidor</div>
          <p className="texto-mudo">Completá estos datos antes de acceder al panel. Los compradores verán esta información en tu perfil público.</p>

          <div className="col gap-s">
            <span className="texto">Nombre comercial</span>
            <Campo placeholder="Nombre comercial *" value={nombreComercial} onChange={(e) => setNombreComercial(e.target.value)} />
            <span className="texto-mudo">El nombre que verán los compradores en el catálogo y en tu perfil.</span>
          </div>

          <div className="col gap-s">
            <span className="texto">Descripción de la distribuidora</span>
            <Campo area placeholder="Descripción del negocio" value={descripcionNegocio} onChange={(e) => setDescripcionNegocio(e.target.value)} />
          </div>

          <div className="col gap-s">
            <span className="texto">Zona de entrega</span>
            <Campo placeholder="Zona de entrega" value={zonaEntrega} onChange={(e) => setZonaEntrega(e.target.value)} />
            <span className="texto-mudo">Indicá las zonas geográficas donde realizás entregas.</span>
          </div>

          <CampoUbicacionMapa
            etiqueta="Ubicación del depósito"
            direccion={direccionPartida}
            onSeleccionar={({ lat, lng, direccion }) => {
              setDireccionPartida(direccion)
              setLatitudPartida(lat)
              setLongitudPartida(lng)
            }}
          />

          <div className="fila gap-m">
            <Boton variante="outline" onClick={() => navigate(rutaInicio())}>Cancelar</Boton>
            <Boton variante="fill" onClick={handleConfigurar}>Guardar y acceder al panel</Boton>
          </div>

          {mensaje && <p className="texto" style={{ color: 'var(--color-error)', margin: 0 }}>{mensaje}</p>}
        </Tarjeta>
      </div>
    </div>
  )
}

export default ConfigurarPerfil
