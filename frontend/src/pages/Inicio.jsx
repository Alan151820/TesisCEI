import { useNavigate } from 'react-router-dom'

function Inicio() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem('nombre')

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    navigate('/login')
  }

  return (
    <div>
      <h1>Bienvenido, {nombre}</h1>
      <button onClick={handleCerrarSesion}>Cerrar sesión</button>
    </div>
  )
}

export default Inicio