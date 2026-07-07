import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function ConfigurarPerfil() {
  const [nombreComercial, setNombreComercial] = useState('')
  const [descripcionNegocio, setDescripcionNegocio] = useState('')
  const [zonaEntrega, setZonaEntrega] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()
  const telefono = localStorage.getItem('telefono')

  const handleConfigurar = async () => {
  try {
    const res = await axios.post('http://localhost:3000/distribuidor/configurarPerfil', {
      telefono,
      nombreComercial,
      descripcionNegocio,
      zonaEntrega
    })
    await axios.post('http://localhost:3000/auth/activarModoDistribuidor', { telefono })
    localStorage.setItem('distribuidorId', res.data.distribuidorId)
    localStorage.setItem('modoDistribuidorActivo', 'true')
    navigate('/inicio')
  } catch (error) {
    setMensaje(error.response?.data?.mensaje || 'No fue posible completar la operación. Intente nuevamente más tarde.')
  }
}

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Configurar perfil de distribuidor</h1>
      <input placeholder='Nombre comercial *' value={nombreComercial} onChange={e => setNombreComercial(e.target.value)} />
      <br /><br />
      <input placeholder='Descripción del negocio' value={descripcionNegocio} onChange={e => setDescripcionNegocio(e.target.value)} />
      <br /><br />
      <input placeholder='Zona de entrega' value={zonaEntrega} onChange={e => setZonaEntrega(e.target.value)} />
      <br /><br />
      <button onClick={handleConfigurar}>Guardar perfil</button>
      <p>{mensaje}</p>
    </div>
  )
}

export default ConfigurarPerfil