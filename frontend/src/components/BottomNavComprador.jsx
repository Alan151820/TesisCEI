import { useNavigate, useLocation } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import './BottomNavComprador.css'

function BottomNavComprador() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalItems } = useCarrito()

  const esCatalogo = location.pathname === '/inicioComprador'
    || location.pathname.startsWith('/producto/')
    || location.pathname.startsWith('/perfilDistribuidor/')
  const esCarrito = location.pathname === '/carrito' || location.pathname === '/confirmar-pedido'
  const esPedidos = location.pathname === '/misPedidos' || location.pathname.startsWith('/pedido/')

  return (
    <nav className="comprador-bottom-nav">
      <div className={`comprador-bottom-item${esCatalogo ? ' activo' : ''}`} onClick={() => navigate('/inicioComprador')}>
        <span className="comprador-bottom-icono">◻</span>
        <span className="comprador-bottom-label">Catálogo</span>
      </div>
      <div className={`comprador-bottom-item${esCarrito ? ' activo' : ''}`} onClick={() => navigate('/carrito')}>
        <span className="comprador-bottom-icono comprador-bottom-icono--carrito">
          🛒{totalItems > 0 && <span className="comprador-bottom-badge">{totalItems}</span>}
        </span>
        <span className="comprador-bottom-label">Carrito</span>
      </div>
      <div className={`comprador-bottom-item${esPedidos ? ' activo' : ''}`} onClick={() => navigate('/misPedidos')}>
        <span className="comprador-bottom-icono">◇</span>
        <span className="comprador-bottom-label">Pedidos</span>
      </div>
    </nav>
  )
}

export default BottomNavComprador
