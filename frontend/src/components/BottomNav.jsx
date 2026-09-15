import { useNavigate, useLocation } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import './BottomNav.css'

function BottomNav({ variante = 'comprador' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalItems } = useCarrito()
  const token = localStorage.getItem('token')

  const esCatalogo = location.pathname === '/inicioComprador'
    || location.pathname === '/catalogo'
    || location.pathname === '/'
    || location.pathname.startsWith('/producto/')
    || location.pathname.startsWith('/perfilDistribuidor/')
  const esCarrito = location.pathname === '/carrito' || location.pathname === '/confirmar-pedido'
  const esPedidos = location.pathname === '/misPedidos' || location.pathname.startsWith('/pedido/')

  const tercero = variante === 'publico'
    ? (token
      ? { icono: '⊞', label: 'Panel', activo: false, onClick: () => navigate('/inicio') }
      : { icono: '○', label: 'Cuenta', activo: false, onClick: () => navigate('/login') })
    : { icono: '◇', label: 'Pedidos', activo: esPedidos, onClick: () => navigate('/misPedidos') }

  return (
    <nav className="bottom-nav">
      <div
        className={`bottom-nav-item${esCatalogo ? ' activo' : ''}`}
        onClick={() => navigate(variante === 'publico' ? '/catalogo' : '/inicioComprador')}
      >
        <span className="bottom-nav-icono">◻</span>
        <span className="bottom-nav-label">Catálogo</span>
      </div>
      <div className={`bottom-nav-item${esCarrito ? ' activo' : ''}`} onClick={() => navigate('/carrito')}>
        <span className="bottom-nav-icono bottom-nav-icono--carrito">
          🛒{totalItems > 0 && <span className="bottom-nav-badge">{totalItems}</span>}
        </span>
        <span className="bottom-nav-label">Carrito</span>
      </div>
      <div className={`bottom-nav-item${tercero.activo ? ' activo' : ''}`} onClick={tercero.onClick}>
        <span className="bottom-nav-icono">{tercero.icono}</span>
        <span className="bottom-nav-label">{tercero.label}</span>
      </div>
    </nav>
  )
}

export default BottomNav
