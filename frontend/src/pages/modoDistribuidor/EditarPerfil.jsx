import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function EditarPerfil() {
  const [nombreComercial, setNombreComercial] = useState('')
  const [descripcionNegocio, setDescripcionNegocio] = useState('')
  const [zonaEntrega, setZonaEntrega] = useState('')
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()
  const telefono = localStorage.getItem('telefono')

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const res = await axios.post('http://localhost:3000/distribuidor/obtenerPerfilPropio', { telefono })
        setNombreComercial(res.data.nombreComercial)
        setDescripcionNegocio(res.data.descripcionNegocio)
        setZonaEntrega(res.data.zonaEntrega)
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

  const handleEditar = async () => {
    try {
      await axios.put('http://localhost:3000/distribuidor/editarPerfil', {
        telefono,
        nombreComercial,
        descripcionNegocio,
        zonaEntrega
      })

      if (logo) {
        const formData = new FormData()
        formData.append('logo', logo)
        formData.append('telefono', telefono)
        await axios.post('http://localhost:3000/distribuidor/subirLogo', formData)
      }

      setMensaje('Perfil actualizado correctamente.')
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Editar perfil</h1>
      {logoPreview && <img src={logoPreview} alt='Logo' width={100} style={{ borderRadius: '50%' }} />}
      <br /><br />
      <input type='file' accept='image/*' onChange={handleLogo} />
      <br /><br />
      <input placeholder='Nombre comercial *' value={nombreComercial} onChange={e => setNombreComercial(e.target.value)} />
      <br /><br />
      <input placeholder='Descripción del negocio' value={descripcionNegocio} onChange={e => setDescripcionNegocio(e.target.value)} />
      <br /><br />
      <input placeholder='Zona de entrega' value={zonaEntrega} onChange={e => setZonaEntrega(e.target.value)} />
      <br /><br />
      <button onClick={handleEditar}>Guardar cambios</button>
      <br /><br />
      <button onClick={() => navigate('/inicio')}>Volver al panel</button>
      <p>{mensaje}</p>
    </div>
  )
}

export default EditarPerfil