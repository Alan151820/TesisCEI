import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido, rutaInicio } from '../../lib/auth'
import { useCarrito } from '../../context/CarritoContext'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNavComprador from '../../components/BottomNavComprador'
import EstadoBadge from '../../components/EstadoBadge'
import './InicioComprador.css'
import './DetallePedido.css'

function formatearFecha(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DetallePedido() {
  const navigate = useNavigate()
  const { id } = useParams()
  const nombre = localStorage.getItem('nombre') || ''
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const { totalItems } = useCarrito()
  const [menuPerfil, setMenuPerfil] = useState(false)
  const perfilRef = useRef(null)

  useEffect(() => {
    if (!tokenValido()) navigate('/login')
  }, [navigate])

  useEffect(() => {
    if (!menuPerfil) return
    const cerrar = (e) => { if (!perfilRef.current?.contains(e.target)) setMenuPerfil(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [menuPerfil])

  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/api/pedidos/${id}`)
      .then(res => setPedido(res.data))
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }, [id])

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('telefono')
    localStorage.removeItem('modoDistribuidorActivo')
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/catalogo')
  }

  return (
    <div className="detallepedido-pagina">

      <header className="comprador-encabezado">
        <div className="comprador-logo" onClick={() => navigate(rutaInicio())}>MarketDist</div>
        <div className="comprador-buscador">
          <span className="comprador-buscador-icono">⌕</span>
          <input className="comprador-buscador-input" type="text" placeholder="Buscar productos…" />
        </div>
        <div className="comprador-acciones">
          <span className="comprador-nav-link" onClick={() => navigate('/misPedidos')}>Mis pedidos</span>
          <span className="comprador-nav-link" onClick={() => navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil')}>Distribuidora</span>
          <CampanaNotificaciones rutaDestino="/misPedidos" rutaDetalle="/pedido" />
          <button className="comprador-btn-carrito" onClick={() => navigate('/carrito')}>
            🛒{totalItems > 0 && <span className="comprador-carrito-badge">{totalItems}</span>}
          </button>
          <div className="comprador-perfil-wrapper" ref={perfilRef}>
            <button className="comprador-perfil-trigger" onClick={() => setMenuPerfil(v => !v)}>
              <div className="comprador-avatar">{iniciales}</div>
              <span className="comprador-nombre">{nombre}</span>
              <span className="comprador-perfil-flecha">{menuPerfil ? '▴' : '▾'}</span>
            </button>
            {menuPerfil && (
              <div className="comprador-menu-desplegable">
                <div className="comprador-menu-item comprador-menu-item--mobile" onClick={() => { setMenuPerfil(false); navigate('/misPedidos') }}>Mis pedidos</div>
                <div className="comprador-menu-item comprador-menu-item--mobile" onClick={() => { setMenuPerfil(false); navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil') }}>Distribuidora</div>
                <div className="comprador-menu-item" onClick={handleCerrarSesion}>Cerrar sesión</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="detallepedido-main">

        <div className="detallepedido-migas">
          <span className="detallepedido-miga-link" onClick={() => navigate('/misPedidos')}>Mis pedidos</span>
          <span className="detallepedido-miga-separador">›</span>
          <span className="detallepedido-miga-actual">Pedido #{id}</span>
        </div>

        {cargando && (
          <div className="detallepedido-vacio">Cargando pedido...</div>
        )}

        {!cargando && error && (
          <div className="detallepedido-vacio detallepedido-error">{error}</div>
        )}

        {!cargando && !error && pedido && (
          <div className="detallepedido-tarjeta">
            <div className="detallepedido-encabezado-tarjeta">
              <div>
                <div className="detallepedido-numero">Pedido #{pedido.id}</div>
                <div className="detallepedido-subtitulo">
                  {pedido.nombreDistribuidor} · {formatearFecha(pedido.fechaCreacion)} · {pedido.direccionEntrega}
                </div>
              </div>
              <EstadoBadge estado={pedido.estado} className="detallepedido-estado" />
            </div>

            {pedido.estado === 'rechazado' && pedido.motivoRechazo && (
              <div className="detallepedido-motivo">Motivo del rechazo: {pedido.motivoRechazo}</div>
            )}

            <div className="detallepedido-tabla">
              <div className="detallepedido-tabla-header">
                <div>Producto</div>
                <div>Cantidad</div>
                <div>Precio unit.</div>
                <div>Subtotal</div>
              </div>
              {pedido.items.map((item, i) => (
                <div key={i} className="detallepedido-tabla-fila">
                  <div className="detallepedido-celda detallepedido-celda-producto">
                    {item.imagenUrl
                      ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombreProducto} className="detallepedido-thumb" />
                      : <span className="detallepedido-thumb detallepedido-thumb-sinimg">Sin imagen</span>
                    }
                    {item.disponible ? (
                      <button
                        type="button"
                        className="detallepedido-producto-link"
                        onClick={() => navigate(`/producto/${item.productoId}`)}
                      >
                        {item.nombreProducto}
                      </button>
                    ) : (
                      <span className="detallepedido-producto-nodisponible">
                        {item.nombreProducto} <em>(No disponible)</em>
                      </span>
                    )}
                  </div>
                  <div className="detallepedido-celda">{Number(item.cantidad)} u.</div>
                  <div className="detallepedido-celda">${Number(item.precioVentaCongelado).toLocaleString('es-AR')}</div>
                  <div className="detallepedido-celda">${(Number(item.cantidad) * Number(item.precioVentaCongelado)).toLocaleString('es-AR')}</div>
                </div>
              ))}
              <div className="detallepedido-total">
                Total: ${Number(pedido.total).toLocaleString('es-AR')}
              </div>
            </div>
          </div>
        )}

      </main>

      <BottomNavComprador />

    </div>
  )
}

export default DetallePedido
