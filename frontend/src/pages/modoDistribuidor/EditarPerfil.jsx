import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import CampoUbicacionMapa from '../../components/CampoUbicacionMapa'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import Tarjeta from '../../components/ui/Tarjeta'
import Campo from '../../components/ui/Campo'
import Boton from '../../components/ui/Boton'
import './Inicio.css'
import './EditarPerfil.css'

function EditarPerfil() {
  const [nombreComercial, setNombreComercial] = useState('')
  const [descripcionNegocio, setDescripcionNegocio] = useState('')
  const [zonaEntrega, setZonaEntrega] = useState('')
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const navigate = useNavigate()

  const [direccionPartida, setDireccionPartida] = useState('')
  const [latitudPartida, setLatitudPartida] = useState(null)
  const [longitudPartida, setLongitudPartida] = useState(null)

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const res = await api.post('/distribuidor/obtenerPerfilPropio')
        setNombreComercial(res.data.nombreComercial)
        setDescripcionNegocio(res.data.descripcionNegocio)
        setZonaEntrega(res.data.zonaEntrega)
        setDireccionPartida(res.data.direccionPartida || '')
        setLatitudPartida(res.data.latitud ?? null)
        setLongitudPartida(res.data.longitud ?? null)
        if (res.data.logoUrl) setLogoPreview(`http://localhost:3000${res.data.logoUrl}`)
      } catch (error) {
        setMensaje('No fue posible cargar el perfil.')
      }
    }
    cargarPerfil()
  }, [])

  const handleLogo = (e) => {
    const archivo = e.target.files[0]
    setLogo(archivo)
    setLogoPreview(URL.createObjectURL(archivo))
  }

  const handleGuardar = async () => {
    setMensaje('')
    setGuardando(true)
    try {
      await api.put('/distribuidor/editarPerfil', {
        nombreComercial,
        descripcionNegocio,
        zonaEntrega
      })

      if (logo) {
        const formData = new FormData()
        formData.append('logo', logo)
        await api.post('/distribuidor/subirLogo', formData)
      }

      if (direccionPartida) {
        await api.put('/distribuidor/direccionPartida', {
          direccionPartida,
          latitud: latitudPartida,
          longitud: longitudPartida,
        })
      }

      setMensaje('Perfil actualizado correctamente.')
    } catch (error) {
      setMensaje(mensajeDeError(error))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PanelDistribuidor>
          <div className="panel-seccion-header panel-seccion-header--sub">
            <div>
              <h1 className="panel-h1">Editar perfil</h1>
              <p className="panel-subtitulo">Actualizá los datos de tu distribuidora visibles para los compradores.</p>
            </div>
          </div>

          <Tarjeta className="col gap-m editarperfil-card">

            <div className="editarperfil-logo-fila">
              <div className="editarperfil-logo-zona" onClick={() => document.getElementById('input-logo').click()}>
                {logoPreview
                  ? <img src={logoPreview} alt='Logo' className="editarperfil-logo-preview" />
                  : <span className="editarperfil-logo-texto">+ Subir logo</span>
                }
              </div>
              <input
                id="input-logo"
                type='file'
                accept='image/*'
                style={{ display: 'none' }}
                onChange={handleLogo}
              />
            </div>

            <div className="col gap-s">
              <span className="texto">Nombre comercial</span>
              <Campo placeholder='Nombre comercial *' value={nombreComercial} onChange={e => setNombreComercial(e.target.value)} />
            </div>

            <div className="col gap-s">
              <span className="texto">Descripción</span>
              <Campo area placeholder='Descripción del negocio' value={descripcionNegocio} onChange={e => setDescripcionNegocio(e.target.value)} />
            </div>

            <div className="col gap-s">
              <span className="texto">Zona de entrega</span>
              <Campo placeholder='Zona de entrega' value={zonaEntrega} onChange={e => setZonaEntrega(e.target.value)} />
            </div>

            <CampoUbicacionMapa
              etiqueta="Dirección de partida"
              direccion={direccionPartida}
              onSeleccionar={({ lat, lng, direccion }) => {
                setDireccionPartida(direccion)
                setLatitudPartida(lat)
                setLongitudPartida(lng)
              }}
            />

            <div className="fila gap-m">
              <Boton onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </Boton>
              <Boton variante="outline" onClick={() => navigate('/inicio')}>Volver al panel</Boton>
            </div>

            {mensaje && <p className="texto" style={{ margin: 0 }}>{mensaje}</p>}

          </Tarjeta>

    </PanelDistribuidor>
  )
}

export default EditarPerfil
