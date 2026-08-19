import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { rutaInicio } from '../../lib/auth'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNavComprador from '../../components/BottomNavComprador'
import ToggleTema from '../../components/ToggleTema'
import './InicioComprador.css'
import './Carrito.css'

function Carrito() {
  const navigate = useNavigate()
  const { items, modificarCantidad, eliminarProducto, vaciar, totalItems } = useCarrito()
  const token = localStorage.getItem('token')
  const nombre = localStorage.getItem('nombre') || ''
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const [menuPerfil, setMenuPerfil] = useState(false)
  const perfilRef = useRef(null)

  useEffect(() => {
    if (!menuPerfil) return
    const cerrar = (e) => { if (!perfilRef.current?.contains(e.target)) setMenuPerfil(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [menuPerfil])

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('telefono')
    localStorage.removeItem('modoDistribuidorActivo')
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/catalogo')
  }

  const porDistribuidor = items.reduce((acc, item) => {
    const key = item.distribuidorId
    if (!acc[key]) acc[key] = { nombreDistribuidor: item.nombreDistribuidor, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  const subtotalTotal = items.reduce((acc, i) => acc + Number(i.precioMinimo) * i.cantidad, 0)

  return (
    <div className="carrito-pagina">

      <header className="comprador-encabezado">
        <div className="comprador-logo" onClick={() => navigate(rutaInicio())}>MarketDist</div>
        <div className="comprador-buscador">
          <span className="comprador-buscador-icono">⌕</span>
          <input className="comprador-buscador-input" type="text" placeholder="Buscar productos…" />
        </div>
        <div className="comprador-acciones">
          {token ? (
            <>
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
                    <ToggleTema />
                    <div className="comprador-menu-item" onClick={handleCerrarSesion}>Cerrar sesión</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="comprador-btn-carrito" onClick={() => navigate('/carrito')}>
                🛒{totalItems > 0 && <span className="comprador-carrito-badge">{totalItems}</span>}
              </button>
              <button className="catalogo-btn-login" onClick={() => navigate('/login')}>Iniciar sesión</button>
              <button className="catalogo-btn-registro" onClick={() => navigate('/registro')}>Registrarse</button>
            </>
          )}
        </div>
      </header>

      <div className="carrito-contenido">

        {items.length === 0 ? (
          <div className="carrito-vacio">
            <div className="carrito-vacio-icono">🛒</div>
            <div className="carrito-vacio-titulo">Tu carrito está vacío</div>
            <div className="carrito-vacio-subtitulo">Explorá el catálogo y agregá productos.</div>
            <button className="carrito-vacio-btn" onClick={() => navigate(rutaInicio())}>Ver catálogo</button>
          </div>
        ) : (
          <div className="carrito-layout">
            <div className="carrito-lista">
              {Object.entries(porDistribuidor).map(([distId, grupo]) => (
                <div key={distId} className="carrito-grupo">
                  <div className="carrito-grupo-header">{grupo.nombreDistribuidor}</div>
                  {grupo.items.map(item => (
                    <div key={item.id} className="carrito-item">
                      <div className="carrito-item-foto">
                        {item.imagenUrl
                          ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombre} className="carrito-item-img" />
                          : <div className="carrito-item-img-placeholder">—</div>
                        }
                      </div>
                      <div className="carrito-item-info">
                        <div className="carrito-item-nombre">{item.nombre}</div>
                        <div className="carrito-item-precio">
                          Precio est. ${Number(item.precioMinimo).toLocaleString('es-AR')} c/u
                        </div>
                      </div>
                      <div className="carrito-item-controles">
                        <button
                          className="carrito-item-btn"
                          onClick={() => modificarCantidad(item.id, item.cantidad - 1)}
                        >−</button>
                        <span className="carrito-item-cantidad">{item.cantidad}</span>
                        <button
                          className="carrito-item-btn"
                          onClick={() => modificarCantidad(item.id, item.cantidad + 1)}
                        >+</button>
                      </div>
                      <button
                        className="carrito-item-eliminar"
                        onClick={() => eliminarProducto(item.id)}
                      >✕</button>
                    </div>
                  ))}
                </div>
              ))}

              <button className="carrito-vaciar-btn" onClick={vaciar}>Vaciar carrito</button>
            </div>

            <div className="carrito-resumen">
              <div className="carrito-resumen-titulo">Resumen</div>
              <div className="carrito-resumen-fila">
                <span>Productos ({totalItems})</span>
                <span>${subtotalTotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="carrito-resumen-nota">
                * Los precios son estimados según el precio mínimo publicado. El total final depende del volumen y condiciones del distribuidor.
              </div>
              <button
                className="carrito-resumen-btn"
                onClick={() => {
                  if (!localStorage.getItem('token')) {
                    navigate('/login')
                  } else {
                    navigate('/confirmar-pedido')
                  }
                }}
              >
                Confirmar pedido
              </button>
            </div>
          </div>
        )}

      </div>

      <BottomNavComprador />

    </div>
  )
}

export default Carrito
