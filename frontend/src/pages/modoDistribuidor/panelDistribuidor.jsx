import { useNavigate } from 'react-router-dom'

function PanelDistribuidor() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem('nombre')

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Panel del Distribuidor</h1>
      <p>Bienvenido, {nombre}</p>
      <button onClick={() => navigate('/inicio')}>Cambiar a modo comprador</button>
    </div>
  )
}

export default PanelDistribuidor