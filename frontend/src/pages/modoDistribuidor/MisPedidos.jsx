import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
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

const ETIQUETA_ESTADO = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  en_camino: 'En camino',
}

function sufijoPorTipo(tipoProducto, metricaVisualizacion) {
  if (tipoProducto === 'fraccionable') {
    if (metricaVisualizacion === 'kilogramos') return 'kg'
    if (metricaVisualizacion === 'litros') return 'L'
    if (metricaVisualizacion === 'metros') return 'm'
  }
  return 'u.'
}

function formatearFecha(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
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
  const [erroresAccion, setErroresAccion] = useState({})
  const [procesando, setProcesando] = useState(new Set())

  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  useEffect(() => {
    api.get('/api/pedidos/activos')
      .then(res => setPedidos(res.data))
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }, [])

  const handleAceptar = async (pedidoId) => {
    setProcesando(prev => new Set(prev).add(pedidoId))
    setErroresAccion(prev => ({ ...prev, [pedidoId]: null }))
    try {
      const res = await api.patch(`/api/pedidos/${pedidoId}/aceptar`)
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: 'aceptado' } : p))
      window.open(res.data.deepLink, '_blank')
    } catch (err) {
      const mensaje = err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'
      setErroresAccion(prev => ({ ...prev, [pedidoId]: mensaje }))
    } finally {
      setProcesando(prev => { const s = new Set(prev); s.delete(pedidoId); return s })
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
          <nav className="panel-drawer" onClick={e => e.stopPropagation()}>
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

      <div className="panel-mobile-header">
        <span className="panel-mobile-hamburger" onClick={() => setMenuAbierto(true)}>≡</span>
        <div className="panel-mobile-titulo">Pedidos activos</div>
        <div style={{ width: 40 }} />
      </div>

      <header className="panel-master-header">
        <div className="panel-master-header-marca">MarketDist</div>
        <div className="panel-master-header-perfil">
          <div className="panel-master-header-avatar">{iniciales}</div>
        </div>
      </header>

      <div className="panel-layout">

        <aside className="panel-sidebar">
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

          <div className="panel-sidebar-cambiar-modo">
            <button className="panel-sidebar-cambiar-btn" onClick={() => navigate('/inicioComprador')}>
              ← Cambiar a modo comprador
            </button>
          </div>

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

            <div className="panel-seccion-header">
              <div>
                <h1 className="panel-h1">Pedidos activos</h1>
                <p className="panel-subtitulo">Pedidos en estado Pendiente, Aceptado y En camino.</p>
              </div>
            </div>

            {cargando && (
              <div className="panel-tabla-vacio">Cargando pedidos...</div>
            )}

            {!cargando && error && (
              <div className="panel-tabla-vacio pedidos-error">{error}</div>
            )}

            {!cargando && !error && pedidos.length === 0 && (
              <div className="panel-tabla-vacio">No tenés pedidos activos en este momento.</div>
            )}

            {!cargando && !error && pedidos.length > 0 && (
              <div className="panel-tabla-wrapper">
                <div className="pedidos-tabla-header">
                  <div>N° Pedido</div>
                  <div>Comprador</div>
                  <div>Productos</div>
                  <div>Total</div>
                  <div>Estado</div>
                  <div>Acciones</div>
                </div>

                {pedidos.map(p => (
                  <div key={p.id}>
                  <div className="pedidos-tabla-fila">
                    <div className="pedidos-celda pedidos-numero">#{p.id}</div>
                    <div className="pedidos-celda">
                      <div>
                        <div>{p.nombreComprador}</div>
                        <div className="pedidos-telefono">{p.telefonoComprador}</div>
                      </div>
                    </div>
                    <div className="pedidos-celda">
                      <div className="pedidos-productos-lista">
                        {p.items.map((item, i) => {
                          const sufijo = sufijoPorTipo(item.tipoProducto, item.metricaVisualizacion)
                          return (
                            <div key={i} className="pedidos-producto-item">
                              <span>{item.nombreProducto} ×{Number(item.cantidad)} {sufijo}</span>
                              <span className="pedidos-producto-stock">Stock: {item.stockDisponible} {sufijo}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div className="pedidos-celda">${Number(p.total).toLocaleString('es-AR')}</div>
                    <div className="pedidos-celda">
                      <span className={`pedidos-estado pedidos-estado--${p.estado}`}>
                        {ETIQUETA_ESTADO[p.estado] ?? p.estado}
                      </span>
                    </div>
                    <div className="pedidos-celda">
                      <div className="pedidos-acciones">
                        {p.estado === 'pendiente' && (
                          <>
                            <button
                              className="pedidos-accion-btn pedidos-accion-btn--primario"
                              disabled={procesando.has(p.id)}
                              onClick={() => handleAceptar(p.id)}
                            >
                              {procesando.has(p.id) ? 'Aceptando...' : 'Aceptar'}
                            </button>
                            <button className="pedidos-accion-btn pedidos-accion-btn--peligro">Rechazar</button>
                            <button className="pedidos-accion-btn">Proponer sustituto</button>
                          </>
                        )}
                        {p.estado === 'aceptado' && (
                          <button className="pedidos-accion-btn pedidos-accion-btn--primario">Marcar En camino</button>
                        )}
                        {p.estado === 'en_camino' && (
                          <button className="pedidos-accion-btn pedidos-accion-btn--primario">Marcar Entregado</button>
                        )}
                      </div>
                    </div>
                  </div>
                  {erroresAccion[p.id] && (
                    <div className="pedidos-error-accion">{erroresAccion[p.id]}</div>
                  )}
                  </div>
                ))}

                <div className="panel-tabla-contador">
                  {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} activo{pedidos.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}

          </div>
        </main>

      </div>
    </div>
  )
}

export default MisPedidos
