import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import CampoUbicacionMapa from '../../components/CampoUbicacionMapa'
import PanelDistribuidor from '../../components/PanelDistribuidor'
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
  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  // RF-042: dirección de partida del depósito. Se guarda junto con el resto
  // del perfil (RF-049) en una única acción de "Guardar cambios".
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
      setMensaje(error.response?.data?.mensaje || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PanelDistribuidor tituloMobile="Editar perfil">
          <div className="panel-seccion-header">
            <div>
              <h1 className="panel-h1">Editar perfil</h1>
              <p className="panel-subtitulo">Actualizá los datos de tu distribuidora visibles para los compradores.</p>
            </div>
          </div>

          <div className="editarperfil-card">

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

            <div className="editarperfil-campo">
              <label className="editarperfil-label">Nombre comercial</label>
              <input
                className="editarperfil-input"
                placeholder='Nombre comercial *'
                value={nombreComercial}
                onChange={e => setNombreComercial(e.target.value)}
              />
            </div>

            <div className="editarperfil-campo">
              <label className="editarperfil-label">Descripción</label>
              <textarea
                className="editarperfil-textarea"
                placeholder='Descripción del negocio'
                value={descripcionNegocio}
                onChange={e => setDescripcionNegocio(e.target.value)}
              />
            </div>

            <div className="editarperfil-campo">
              <label className="editarperfil-label">Zona de entrega</label>
              <input
                className="editarperfil-input"
                placeholder='Zona de entrega'
                value={zonaEntrega}
                onChange={e => setZonaEntrega(e.target.value)}
              />
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

            <div className="editarperfil-acciones">
              <button className="editarperfil-btn-guardar" onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button className="editarperfil-btn-cancelar" onClick={() => navigate('/inicio')}>Volver al panel</button>
            </div>

            <p className="editarperfil-mensaje">{mensaje}</p>

          </div>

    </PanelDistribuidor>
  )
}

export default EditarPerfil
