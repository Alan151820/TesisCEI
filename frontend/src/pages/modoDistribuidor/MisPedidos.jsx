import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import ModalMapaDireccion from '../../components/ModalMapaDireccion'
import EstadoBadge from '../../components/EstadoBadge'
import './Inicio.css'
import './MisPedidos.css'

const NAV_ITEMS = [
  { label: 'Pedidos', ruta: '/pedidos' },
  { label: 'Productos', ruta: '/inicio' },
  { label: 'Proveedores', ruta: '/proveedores' },
  { label: 'Reparto', ruta: '/reparto' },
  { label: 'Reportes', ruta: '/reportes' },
  { label: 'Empleados', ruta: '/empleados' },
  { label: 'Editar perfil', ruta: '/editarPerfil' },
]

function formatearFecha(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function FilaPedido({ pedido: p, onVerUbicacion, navigate }) {
  return (
    <div className="pedidos-tabla-fila pedidos-fila-clickeable" onClick={() => navigate(`/pedidos/${p.id}`)}>
      <div className="pedidos-celda pedidos-numero">#{p.id}</div>
      <div className="pedidos-celda">{formatearFecha(p.fechaCreacion)}</div>
      <div className="pedidos-celda">{p.nombreComprador}</div>
      <div className="pedidos-celda">
        <div className="pedidos-productos-lista">
          {p.items.map((item, i) => (
            <div key={i} className="pedidos-producto-item pedidos-producto-item--imagen">
              {item.imagenUrl
                ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombreProducto} className="pedidos-thumb" />
                : <span className="pedidos-thumb pedidos-thumb-sinimg">Sin imagen</span>
              }
              <span>{item.nombreProducto} ×{Number(item.cantidad)} u.</span>
            </div>
          ))}
        </div>
      </div>
      <div className="pedidos-celda">${Number(p.total).toLocaleString('es-AR')}</div>
      <div className="pedidos-celda">
        <EstadoBadge estado={p.estado} />
      </div>
      <div className="pedidos-celda">
        <div className="pedidos-acciones" onClick={e => e.stopPropagation()}>
          {p.latitud && p.longitud && (
            <button type="button" className="pedidos-accion-btn" onClick={() => onVerUbicacion(p)}>
              📍 Ver ubicación
            </button>
          )}
          <button
            type="button"
            className="pedidos-accion-btn"
            onClick={() => window.open(`https://wa.me/${p.telefonoComprador.replace(/^\+/, '')}`, '_blank')}
          >
            💬 Mensaje
          </button>
        </div>
      </div>
    </div>
  )
}

function MisPedidos() {
  const navigate = useNavigate()
  const location = useLocation()
  const nombre = localStorage.getItem('nombre') || ''
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [menuPerfil, setMenuPerfil] = useState(false)
  const perfilRef = useRef(null)
  const [pedidoMapa, setPedidoMapa] = useState(null)

  useEffect(() => {
    if (!menuPerfil) return
    const cerrar = (e) => { if (!perfilRef.current?.contains(e.target)) setMenuPerfil(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [menuPerfil])

  // RF-031: historial completo de pedidos (todos los estados), aparte del
  // panel de activos que ya existía.
  const [vista, setVista] = useState('activos')
  const [historial, setHistorial] = useState([])
  const [historialCargado, setHistorialCargado] = useState(false)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [errorHistorial, setErrorHistorial] = useState(null)

  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  useEffect(() => {
    api.get('/api/pedidos/activos')
      .then(res => setPedidos(res.data))
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }, [])

  const irAVista = (nuevaVista) => {
    setVista(nuevaVista)
    if (nuevaVista === 'historial' && !historialCargado) {
      setCargandoHistorial(true)
      api.get('/api/pedidos/historial')
        .then(res => { setHistorial(res.data); setHistorialCargado(true) })
        .catch(err => setErrorHistorial(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
        .finally(() => setCargandoHistorial(false))
    }
  }

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/login')
  }

  return (
    <div className="panel-root">

      {menuAbierto && (
        <div className="panel-drawer-overlay" onClick={() => setMenuAbierto(false)}>
          <nav className="panel-drawer" data-tema="oscuro" onClick={e => e.stopPropagation()}>
            <div className="panel-drawer-top">
              <div className="panel-drawer-marca">MarketDist</div>
              <button className="panel-drawer-cerrar-btn" onClick={() => setMenuAbierto(false)}>✕</button>
            </div>
            {NAV_ITEMS.map(item => (
              <div
                key={item.ruta}
                className={`panel-drawer-item${location.pathname === item.ruta ? ' activo' : ''}`}
                onClick={() => { navigate(item.ruta); setMenuAbierto(false) }}
              >
                {item.label}
              </div>
            ))}
            <div className="panel-drawer-sep" />
            <button className="panel-drawer-modo" onClick={() => { navigate('/inicioComprador'); setMenuAbierto(false) }}>
              ← Modo comprador
            </button>
            <div className="panel-drawer-footer">
              <div className="panel-drawer-nombre">{nombre}</div>
              <div className="panel-drawer-rol">Distribuidor</div>
              <button className="panel-drawer-logout" onClick={handleCerrarSesion}>Cerrar sesión</button>
            </div>
          </nav>
        </div>
      )}

      <div className="panel-mobile-header" data-tema="oscuro">
        <span className="panel-mobile-hamburger" onClick={() => setMenuAbierto(true)}>≡</span>
        <div className="panel-mobile-titulo">Pedidos activos</div>
        <div style={{ width: 40 }} />
      </div>

      <header className="panel-master-header">
        <div className="panel-master-header-marca">MarketDist</div>
        <div className="panel-master-header-perfil">
          <button className="panel-header-salir-btn" onClick={() => navigate('/inicioComprador')}>
            Salir de distribuidora
          </button>
          <div className="comprador-perfil-wrapper" ref={perfilRef}>
            <button className="comprador-perfil-trigger" onClick={() => setMenuPerfil(v => !v)}>
              <div className="comprador-avatar">{iniciales}</div>
              <span className="comprador-nombre">{nombre}</span>
              <span className="comprador-perfil-flecha">{menuPerfil ? '▴' : '▾'}</span>
            </button>
            {menuPerfil && (
              <div className="comprador-menu-desplegable">
                <div className="comprador-menu-item" onClick={handleCerrarSesion}>Cerrar sesión</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="panel-layout">

        <aside className="panel-sidebar" data-tema="oscuro">
          <div className="panel-sidebar-marca">
            <div className="panel-sidebar-titulo">MarketDist</div>
            <div className="panel-sidebar-subtitulo">Panel del Distribuidor</div>
          </div>

          <nav className="panel-nav">
            {NAV_ITEMS.map(item => (
              <div
                key={item.ruta}
                className={`panel-nav-item${location.pathname === item.ruta ? ' activo' : ''}`}
                onClick={() => navigate(item.ruta)}
              >
                {item.label}
              </div>
            ))}
          </nav>

          <div className="panel-sidebar-footer">
            <div className="panel-sidebar-usuario">
              <div className="panel-avatar-small">{iniciales}</div>
              <div>
                <div className="panel-sidebar-nombre">{nombre}</div>
                <div className="panel-sidebar-rol">Distribuidor</div>
              </div>
            </div>
            <div className="panel-sidebar-accion" onClick={handleCerrarSesion}>Cerrar sesión</div>
          </div>
        </aside>

        <main className="panel-main">
          <div className="panel-contenido">
            <div className="panel-contenido-centrado">

            <div className="panel-seccion-header">
              <div>
                <h1 className="panel-h1">{vista === 'activos' ? 'Pedidos activos' : 'Historial de pedidos'}</h1>
                <p className="panel-subtitulo">
                  {vista === 'activos'
                    ? 'Pedidos en estado Pendiente, Aceptado y En camino.'
                    : 'Todos tus pedidos recibidos, incluyendo los finalizados.'}
                </p>
              </div>
            </div>

            <div className="pedidos-tabs">
              <button
                type="button"
                className={`pedidos-tab${vista === 'activos' ? ' pedidos-tab--activo' : ''}`}
                onClick={() => irAVista('activos')}
              >
                Activos
              </button>
              <button
                type="button"
                className={`pedidos-tab${vista === 'historial' ? ' pedidos-tab--activo' : ''}`}
                onClick={() => irAVista('historial')}
              >
                Historial
              </button>
            </div>

            {vista === 'activos' && cargando && (
              <div className="panel-tabla-vacio">Cargando pedidos...</div>
            )}

            {vista === 'activos' && !cargando && error && (
              <div className="panel-tabla-vacio pedidos-error">{error}</div>
            )}

            {vista === 'activos' && !cargando && !error && pedidos.length === 0 && (
              <div className="panel-tabla-vacio">No tenés pedidos activos en este momento.</div>
            )}

            {vista === 'activos' && !cargando && !error && pedidos.length > 0 && (
              <div className="panel-tabla-wrapper">
                <div className="pedidos-tabla-header">
                  <div>Pedido</div>
                  <div>Fecha</div>
                  <div>Comprador</div>
                  <div>Productos</div>
                  <div>Total</div>
                  <div>Estado</div>
                  <div></div>
                </div>

                {pedidos.map(p => (
                  <FilaPedido key={p.id} pedido={p} onVerUbicacion={setPedidoMapa} navigate={navigate} />
                ))}

                <div className="panel-tabla-contador">
                  {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} activo{pedidos.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {vista === 'historial' && cargandoHistorial && (
              <div className="panel-tabla-vacio">Cargando pedidos...</div>
            )}

            {vista === 'historial' && !cargandoHistorial && errorHistorial && (
              <div className="panel-tabla-vacio pedidos-error">{errorHistorial}</div>
            )}

            {vista === 'historial' && !cargandoHistorial && !errorHistorial && historial.length === 0 && (
              <div className="panel-tabla-vacio">Aún no recibiste pedidos.</div>
            )}

            {vista === 'historial' && !cargandoHistorial && !errorHistorial && historial.length > 0 && (
              <div className="panel-tabla-wrapper">
                <div className="pedidos-tabla-header">
                  <div>Pedido</div>
                  <div>Fecha</div>
                  <div>Comprador</div>
                  <div>Productos</div>
                  <div>Total</div>
                  <div>Estado</div>
                  <div></div>
                </div>

                {historial.map(p => (
                  <FilaPedido key={p.id} pedido={p} onVerUbicacion={setPedidoMapa} navigate={navigate} />
                ))}

                <div className="panel-tabla-contador">
                  {historial.length} pedido{historial.length !== 1 ? 's' : ''} en total
                </div>
              </div>
            )}

            </div>
          </div>
        </main>

      </div>

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
