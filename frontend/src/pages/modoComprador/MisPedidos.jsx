import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido, rutaInicio } from '../../lib/auth'
import { useCarrito } from '../../context/CarritoContext'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import ModalMapaDireccion from '../../components/ModalMapaDireccion'
import BottomNavComprador from '../../components/BottomNavComprador'
import EstadoBadge from '../../components/EstadoBadge'
import ToggleTema from '../../components/ToggleTema'
import './InicioComprador.css'
import './MisPedidos.css'

function formatearFecha(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function MisPedidos() {
  const navigate = useNavigate()
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

  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [pedidoMapa, setPedidoMapa] = useState(null)

  useEffect(() => {
    api.get('/api/pedidos/mis-pedidos')
      .then(res => setPedidos(res.data))
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }, [])

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('telefono')
    localStorage.removeItem('modoDistribuidorActivo')
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/catalogo')
  }

  return (
    <div className="mispedidos-pagina">

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
                <ToggleTema />
                <div className="comprador-menu-item" onClick={handleCerrarSesion}>Cerrar sesión</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mispedidos-main">

        <div className="mispedidos-encabezado">
          <h1 className="mispedidos-titulo">Mis pedidos</h1>
          <p className="mispedidos-subtitulo">Historial de todos tus pedidos.</p>
        </div>

        {cargando && (
          <div className="mispedidos-vacio">Cargando pedidos...</div>
        )}

        {!cargando && error && (
          <div className="mispedidos-vacio mispedidos-error">{error}</div>
        )}

        {!cargando && !error && pedidos.length === 0 && (
          <div className="mispedidos-vacio">Aún no realizaste pedidos.</div>
        )}

        {!cargando && !error && pedidos.length > 0 && (
          <>
            {/* Tabla desktop */}
            <div className="mispedidos-tabla">
              <div className="mispedidos-tabla-header">
                <div>Pedido</div>
                <div>Fecha</div>
                <div>Imagen</div>
                <div>Producto</div>
                <div>Distribuidor</div>
                <div>Total</div>
                <div>Estado</div>
              </div>
              {pedidos.map(p => (
                <div key={p.id} className="mispedidos-tabla-fila mispedidos-fila-clickeable" onClick={() => navigate(`/pedido/${p.id}`)}>
                  <div className="mispedidos-celda mispedidos-celda-id">#{p.id}</div>
                  <div className="mispedidos-celda">{formatearFecha(p.fechaCreacion)}</div>
                  <div className="mispedidos-celda mispedidos-celda-col">
                    {p.items.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        className="mispedidos-thumb"
                        onClick={(e) => { e.stopPropagation(); navigate(`/producto/${item.productoId}`) }}
                        aria-label={`Ver ${item.nombreProducto}`}
                      >
                        {item.imagenUrl
                          ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombreProducto} className="mispedidos-thumb-img" />
                          : <span className="mispedidos-thumb-sinimg">Sin imagen</span>
                        }
                      </button>
                    ))}
                  </div>
                  <div className="mispedidos-celda mispedidos-celda-col">
                    {p.items.map((item, i) => (
                      <div key={i} className="mispedidos-item-linea">
                        {item.disponible ? (
                          <button
                            type="button"
                            className="mispedidos-titulo-link"
                            onClick={(e) => { e.stopPropagation(); navigate(`/producto/${item.productoId}`) }}
                          >
                            {item.nombreProducto}
                          </button>
                        ) : (
                          <span className="mispedidos-titulo-nodisponible">
                            {item.nombreProducto} <em>(No disponible)</em>
                          </span>
                        )}
                        <span className="mispedidos-cantidad">{Number(item.cantidad)} u.</span>
                      </div>
                    ))}
                  </div>
                  <div className="mispedidos-celda mispedidos-celda-col">
                    <div>{p.nombreDistribuidor}</div>
                    {p.latitud && p.longitud && (
                      <button type="button" className="mispedidos-btn-mapa" onClick={(e) => { e.stopPropagation(); setPedidoMapa(p) }}>
                        📍 Ver mapa
                      </button>
                    )}
                  </div>
                  <div className="mispedidos-celda">${Number(p.total).toLocaleString('es-AR')}</div>
                  <div className="mispedidos-celda">
                    <EstadoBadge estado={p.estado} />
                  </div>
                </div>
              ))}
            </div>

            {/* Cards mobile */}
            <div className="mispedidos-cards">
              {pedidos.map(p => (
                <div key={p.id} className="mispedidos-card mispedidos-fila-clickeable" onClick={() => navigate(`/pedido/${p.id}`)}>
                  <div className="mispedidos-card-fila">
                    <span className="mispedidos-card-id">Pedido #{p.id}</span>
                    <EstadoBadge estado={p.estado} />
                  </div>
                  <div className="mispedidos-card-fila">
                    <span className="mispedidos-card-fecha">{formatearFecha(p.fechaCreacion)}</span>
                  </div>
                  <div className="mispedidos-card-fila">
                    <span className="mispedidos-card-distribuidor">{p.nombreDistribuidor}</span>
                    {p.latitud && p.longitud && (
                      <button type="button" className="mispedidos-btn-mapa" onClick={(e) => { e.stopPropagation(); setPedidoMapa(p) }}>
                        📍 Ver mapa
                      </button>
                    )}
                  </div>
                  {p.items.map((item, i) => (
                    <div key={i} className="mispedidos-card-item">
                      <button
                        type="button"
                        className="mispedidos-thumb"
                        onClick={(e) => { e.stopPropagation(); navigate(`/producto/${item.productoId}`) }}
                        aria-label={`Ver ${item.nombreProducto}`}
                      >
                        {item.imagenUrl
                          ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombreProducto} className="mispedidos-thumb-img" />
                          : <span className="mispedidos-thumb-sinimg">Sin imagen</span>
                        }
                      </button>
                      <div className="mispedidos-card-item-info">
                        {item.disponible ? (
                          <button
                            type="button"
                            className="mispedidos-titulo-link"
                            onClick={(e) => { e.stopPropagation(); navigate(`/producto/${item.productoId}`) }}
                          >
                            {item.nombreProducto}
                          </button>
                        ) : (
                          <span className="mispedidos-titulo-nodisponible">
                            {item.nombreProducto} <em>(No disponible)</em>
                          </span>
                        )}
                        <span className="mispedidos-cantidad">
                          {Number(item.cantidad)} u.
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mispedidos-card-fila mispedidos-card-footer">
                    <span className="mispedidos-card-total-label">Total</span>
                    <span className="mispedidos-card-total">${Number(p.total).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </main>

      {/* Bottom nav mobile */}
      <BottomNavComprador />

      {pedidoMapa && (
        <ModalMapaDireccion
          soloLectura
          ubicacionInicial={{ lat: Number(pedidoMapa.latitud), lng: Number(pedidoMapa.longitud) }}
          direccionInicial={pedidoMapa.direccionEntrega}
          onCerrar={() => setPedidoMapa(null)}
        />
      )}

    </div>
  )
}

export default MisPedidos
