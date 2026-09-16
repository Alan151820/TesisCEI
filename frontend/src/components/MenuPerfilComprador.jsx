import { useNavigate } from 'react-router-dom'
import { cerrarSesion } from '../lib/auth'
import useDesplegable from '../hooks/useDesplegable'
import Avatar from './ui/Avatar'

function MenuPerfilComprador() {
  const navigate = useNavigate()
  const { abierto, setAbierto, ref } = useDesplegable()

  const nombre = localStorage.getItem('nombre') || ''
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const rutaDistribuidora = modoDistribuidorActivo ? '/inicio' : '/configurarPerfil'

  const handleCerrarSesion = () => {
    cerrarSesion()
    navigate('/catalogo')
  }

  return (
    <div className="desplegable-ancla comprador-perfil-wrapper" ref={ref}>
      <button type="button" className="comprador-perfil-trigger" onClick={() => setAbierto(v => !v)}>
        <Avatar nombre={nombre} className="comprador-avatar" />
        <span className="comprador-nombre">{nombre}</span>
        <span className="comprador-perfil-flecha">{abierto ? '▴' : '▾'}</span>
      </button>
      {abierto && (
        <div className="desplegable comprador-menu-desplegable">
          <div className="desplegable-item comprador-menu-item--mobile" onClick={() => { setAbierto(false); navigate('/misPedidos') }}>Mis pedidos</div>
          <div className="desplegable-item comprador-menu-item--mobile" onClick={() => { setAbierto(false); navigate(rutaDistribuidora) }}>Distribuidora</div>
          <div className="desplegable-item" onClick={handleCerrarSesion}>Cerrar sesión</div>
        </div>
      )}
    </div>
  )
}

export default MenuPerfilComprador
