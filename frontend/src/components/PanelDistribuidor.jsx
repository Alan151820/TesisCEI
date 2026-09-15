import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CampanaNotificaciones from './CampanaNotificaciones'
import ToggleTema from './ToggleTema'
import Hdr from './Hdr'
import Boton from './ui/Boton'
import { cerrarSesion } from '../lib/auth'
import '../pages/modoComprador/InicioComprador.css'
import '../pages/modoDistribuidor/Inicio.css'

const NAV_ITEMS = [
  { label: 'Pedidos', ruta: '/pedidos' },
  { label: 'Productos', ruta: '/inicio' },
  { label: 'Proveedores', ruta: '/proveedores' },
  { label: 'Reparto', ruta: '/reparto' },
  { label: 'Reportes', ruta: '/reportes' },
  { label: 'Empleados', ruta: '/empleados' },
  { label: 'Editar perfil', ruta: '/editarPerfil' },
]

function cerrarSesionDistribuidor(navigate) {
  cerrarSesion()
  navigate('/login')
}

function PanelDistribuidor({ tituloMobile, accionMobile, activo, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const rutaActiva = activo ?? location.pathname
  const nombre = localStorage.getItem('nombre') || ''
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  const [menuAbierto, setMenuAbierto] = useState(false)
  const [menuPerfil, setMenuPerfil] = useState(false)
  const perfilRef = useRef(null)

  useEffect(() => {
    if (!menuPerfil) return
    const cerrar = (e) => { if (!perfilRef.current?.contains(e.target)) setMenuPerfil(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [menuPerfil])

  const handleCerrarSesion = () => cerrarSesionDistribuidor(navigate)

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
                className={`panel-drawer-item${rutaActiva === item.ruta ? ' activo' : ''}`}
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
        <div className="panel-mobile-titulo">{tituloMobile}</div>
        <CampanaNotificaciones rutaDestino="/pedidos" rutaDetalle="/pedidos" />
        {accionMobile || <div style={{ width: 40 }} />}
      </div>

      <Hdr logo={<span className="hdr-logo">MarketDist</span>} buscador>
        <Boton variante="fill" onClick={() => navigate('/inicioComprador')}>
          Salir de distribuidora
        </Boton>
        <CampanaNotificaciones rutaDestino="/pedidos" rutaDetalle="/pedidos" />
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
      </Hdr>

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
                className={`panel-nav-item${rutaActiva === item.ruta ? ' activo' : ''}`}
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
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}

export default PanelDistribuidor
