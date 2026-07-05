import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function InicioComprador() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem('nombre')
  const telefono = localStorage.getItem('telefono')
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'

  const handleActivarModo = async () => {
    try {
      await axios.post('http://localhost:3000/auth/activarModoDistribuidor', { telefono })
      localStorage.setItem('modoDistribuidorActivo', 'true')
      navigate('/inicio')
    } catch (error) {
      alert(error.response.data.mensaje)
    }
  }

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('telefono')
    localStorage.removeItem('modoDistribuidorActivo')
    navigate('/login')
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Bienvenido, {nombre}</h1>

      {!modoDistribuidorActivo ? (
        <div>
          <p>Activá el modo distribuidor para acceder al panel.</p>
          <button onClick={handleActivarModo}>Activar modo distribuidor</button>
        </div>
      ) : (
        <button onClick={() => navigate('/Inicio')}>Cambiar a modo distribuidor</button>
      )}

      <br /><br />
      <button onClick={handleCerrarSesion}>Cerrar sesión</button>
    </div>
  )
}

export default InicioComprador