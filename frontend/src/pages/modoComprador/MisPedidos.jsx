import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido, rutaInicio } from '../../lib/auth'
import { useCarrito } from '../../context/CarritoContext'
import './InicioComprador.css'
import './MisPedidos.css'

const ETIQUETA_ESTADO = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  en_camino: 'En camino',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
}

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
                <div>N° Pedido</div>
                <div>Distribuidor</div>
                <div>Fecha</div>
                <div>Total</div>
                <div>Estado</div>
                <div></div>
              </div>
              {pedidos.map(p => (
                <div key={p.id} className="mispedidos-tabla-fila">
                  <div className="mispedidos-celda mispedidos-numero">#{p.id}</div>
                  <div className="mispedidos-celda">{p.nombreDistribuidor}</div>
                  <div className="mispedidos-celda">{formatearFecha(p.fechaCreacion)}</div>
                  <div className="mispedidos-celda">${Number(p.total).toLocaleString('es-AR')}</div>
                  <div className="mispedidos-celda">
                    <span className={`mispedidos-estado mispedidos-estado--${p.estado}`}>
                      {ETIQUETA_ESTADO[p.estado] ?? p.estado}
                    </span>
                  </div>
                  <div className="mispedidos-celda mispedidos-ver">Ver →</div>
                </div>
              ))}
            </div>

            {/* Cards mobile */}
            <div className="mispedidos-cards">
              {pedidos.map(p => (
                <div key={p.id} className="mispedidos-card">
                  <div className="mispedidos-card-fila">
                    <span className="mispedidos-card-numero">#{p.id}</span>
                    <span className={`mispedidos-estado mispedidos-estado--${p.estado}`}>
                      {ETIQUETA_ESTADO[p.estado] ?? p.estado}
                    </span>
                  </div>
                  <div className="mispedidos-card-distribuidor">{p.nombreDistribuidor}</div>
                  <div className="mispedidos-card-fila mispedidos-card-footer">
                    <span className="mispedidos-card-fecha">{formatearFecha(p.fechaCreacion)}</span>
                    <span className="mispedidos-card-total">${Number(p.total).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </main>

      {/* Bottom nav mobile */}
      <nav className="mispedidos-bottom-nav">
        <div className="mispedidos-bottom-item" onClick={() => navigate('/inicioComprador')}>
          <span className="mispedidos-bottom-icono">◻</span>
          <span className="mispedidos-bottom-label">Catálogo</span>
        </div>
        <div className="mispedidos-bottom-item" onClick={() => navigate('/carrito')}>
          <span className="mispedidos-bottom-icono">
            🛒{totalItems > 0 && <span className="mispedidos-bottom-badge">{totalItems}</span>}
          </span>
          <span className="mispedidos-bottom-label">Carrito</span>
        </div>
        <div className="mispedidos-bottom-item activo">
          <span className="mispedidos-bottom-icono">◇</span>
          <span className="mispedidos-bottom-label">Pedidos</span>
        </div>
      </nav>

    </div>
  )
}

export default MisPedidos
