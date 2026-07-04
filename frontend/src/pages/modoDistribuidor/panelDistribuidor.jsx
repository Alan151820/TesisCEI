import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function PanelDistribuidor() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem('nombre')
  const telefono = localStorage.getItem('telefono')

  useEffect(() => {
    const verificarPerfil = async () => {
      try {
        const res = await axios.post('http://localhost:3000/distribuidor/verificarPerfil', { telefono })
        if (!res.data.perfilConfigurado) {
          navigate('/configurarPerfil')
        } else {
          localStorage.setItem('distribuidorId', res.data.distribuidorId)
        }
      } catch (error) {
        navigate('/configurarPerfil')
      }
    }
    verificarPerfil()
  }, [])

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Panel del Distribuidor</h1>
      <p>Bienvenido, {nombre}</p>
      <button onClick={() => navigate('/inicio')}>Cambiar a modo comprador</button>
    </div>
  )
}

export default PanelDistribuidor