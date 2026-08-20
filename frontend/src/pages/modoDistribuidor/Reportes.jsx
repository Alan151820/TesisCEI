import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import ToggleTema from '../../components/ToggleTema'
import './Reportes.css'

const NAV_ITEMS = [
  { label: 'Pedidos', ruta: '/pedidos' },
  { label: 'Productos', ruta: '/inicio' },
  { label: 'Proveedores', ruta: '/proveedores' },
  { label: 'Reparto', ruta: '/reparto' },
  { label: 'Reportes', ruta: '/reportes' },
  { label: 'Empleados', ruta: '/empleados' },
  { label: 'Editar perfil', ruta: '/editarPerfil' },
]

// RF-041: períodos disponibles. 'mes' es el default.
const PERIODOS = [
  { valor: 'dia', label: 'Día' },
  { valor: 'semana', label: 'Semana' },
  { valor: 'mes', label: 'Mes' },
]

function formatearPesos(valor) {
  return `$${Number(valor).toLocaleString('es-AR')}`
}

function Reportes() {
  const navigate = useNavigate()
  const location = useLocation()
  const nombre = localStorage.getItem('nombre') || ''
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  const [menuPerfil, setMenuPerfil] = useState(false)
  const perfilRef = useRef(null)

  const [periodo, setPeriodo] = useState('mes')
  const [reporte, setReporte] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  useEffect(() => {
    if (!menuPerfil) return
    const cerrar = (e) => { if (!perfilRef.current?.contains(e.target)) setMenuPerfil(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [menuPerfil])

  useEffect(() => {
    setCargando(true)
    setMensaje('')
    api.get('/api/reportes/rendimiento', { params: { periodo } })
      .then(res => setReporte(res.data))
      .catch(err => {
        setMensaje(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
      })
      .finally(() => setCargando(false))
  }, [periodo])

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/login')
  }

  const sinPedidos = reporte && reporte.cantidadPedidosEntregados === 0

  return (
    <div className="panel-root">

      <header className="panel-master-header">
        <div className="panel-master-header-marca">MarketDist</div>
        <div className="panel-master-header-buscador">
          <span className="panel-master-header-buscador-icono">⌕</span>
          <input className="panel-master-header-buscador-input" type="text" placeholder="Buscar productos…" />
        </div>
        <div className="panel-master-header-perfil">
          <button className="panel-header-salir-btn" onClick={() => navigate('/inicioComprador')}>
            Salir de distribuidora
          </button>
          <CampanaNotificaciones rutaDestino="/pedidos" />
          <div className="comprador-perfil-wrapper" ref={perfilRef}>
            <button className="comprador-perfil-trigger" onClick={() => setMenuPerfil(v => !v)}>
              <div className="comprador-avatar">{iniciales}</div>
              <span className="comprador-nombre">{nombre}</span>
              <span className="comprador-perfil-flecha">{menuPerfil ? '▴' : '▾'}</span>
            </button>
            {menuPerfil && (
              <div className="comprador-menu-desplegable">
                <ToggleTema />
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
                className={`panel-nav-item${location.pathname === item.ruta || (item.ruta === '/reportes' && location.pathname.startsWith('/reportes')) ? ' activo' : ''}`}
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

            <div className="reportes-subnav">
              <span className="reportes-subnav-item activo" onClick={() => navigate('/reportes')}>Rendimiento</span>
              <span className="reportes-subnav-item" onClick={() => navigate('/reportes/rentabilidad')}>Rentabilidad</span>
            </div>

            <div className="panel-seccion-header">
              <div>
                <h1 className="panel-h1">Dashboard de rendimiento</h1>
                <p className="panel-subtitulo">Resumen del período seleccionado.</p>
              </div>
              <div className="reportes-periodo-tabs">
                {PERIODOS.map(p => (
                  <div
                    key={p.valor}
                    className={`reportes-periodo-tab${periodo === p.valor ? ' activo' : ''}`}
                    onClick={() => setPeriodo(p.valor)}
                  >
                    {p.label}
                  </div>
                ))}
              </div>
            </div>

            {mensaje && <p className="reportes-vacio">{mensaje}</p>}

            {cargando && !mensaje && <p className="reportes-vacio">Cargando...</p>}

            {!cargando && !mensaje && reporte && (
              <>
                <div className="reportes-kpis">
                  <div className="reportes-kpi-card">
                    <div className="reportes-kpi-label">Total facturado</div>
                    <div className="reportes-kpi-valor">{formatearPesos(reporte.totalFacturado)}</div>
                  </div>
                  <div className="reportes-kpi-card">
                    <div className="reportes-kpi-label">Pedidos entregados</div>
                    <div className="reportes-kpi-valor">{reporte.cantidadPedidosEntregados}</div>
                  </div>
                </div>

                {sinPedidos ? (
                  <p className="reportes-vacio">No hay pedidos completados en el período seleccionado.</p>
                ) : (
                  <div className="reportes-tablas">
                    <div className="reportes-tabla-card">
                      <div className="reportes-tabla-titulo">Productos más vendidos</div>
                      <div className="reportes-tabla-header">
                        <div>Producto</div>
                        <div>Unidades</div>
                      </div>
                      {reporte.productosMasVendidos.map(p => (
                        <div className="reportes-tabla-fila" key={p.id}>
                          <div>{p.nombre}</div>
                          <div>{p.unidadesVendidas}</div>
                        </div>
                      ))}
                    </div>
                    <div className="reportes-tabla-card">
                      <div className="reportes-tabla-titulo">Productos menos vendidos</div>
                      <div className="reportes-tabla-header">
                        <div>Producto</div>
                        <div>Unidades</div>
                      </div>
                      {reporte.productosMenosVendidos.map(p => (
                        <div className="reportes-tabla-fila" key={p.id}>
                          <div>{p.nombre}</div>
                          <div>{p.unidadesVendidas}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </main>

      </div>
    </div>
  )
}

export default Reportes
