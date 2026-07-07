import { useNavigate } from 'react-router-dom'

function InicioComprador() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem('nombre')
const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const handleActivarModo = () => {
    navigate('/configurarPerfil')
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
        <button onClick={() => navigate('/inicio')}>Cambiar a modo distribuidor</button>
      )}

      <br /><br />
      <button onClick={handleCerrarSesion}>Cerrar sesión</button>
    </div>
  )
}

export default InicioComprador