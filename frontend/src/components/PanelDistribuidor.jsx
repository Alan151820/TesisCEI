import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CampanaNotificaciones from './CampanaNotificaciones'
import Hdr from './Hdr'
import Boton from './ui/Boton'
import Avatar from './ui/Avatar'
import Marca from './Marca'
import useDesplegable from '../hooks/useDesplegable'
import { cerrarSesion } from '../lib/auth'
import '../pages/modoComprador/InicioComprador.css'
import '../pages/modoDistribuidor/Inicio.css'

const NAV_ITEMS = [
  { label: 'Pedidos', ruta: '/pedidos' },
  { label: 'Productos', ruta: '/inicio' },
  { label: 'Reparto', ruta: '/reparto' },
  { label: 'Reportes', ruta: '/reportes' },
  { label: 'Editar perfil', ruta: '/editarPerfil' },
]

function cerrarSesionDistribuidor(navigate) {
  cerrarSesion()
  navigate('/login')
}

function NavItems({ rutaActiva, onNavegar }) {
  const navigate = useNavigate()
  return NAV_ITEMS.map(item => (
    <div
      key={item.ruta}
      className={`panel-nav-item${rutaActiva === item.ruta ? ' activo' : ''}`}
      onClick={() => { navigate(item.ruta); onNavegar?.() }}
    >
      {item.label}
    </div>
  ))
}

function PanelDistribuidor({ activo, buscadorValor, onBuscadorChange, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const rutaActiva = activo ?? location.pathname
  const nombre = localStorage.getItem('nombre') || ''

  const [menuAbierto, setMenuAbierto] = useState(false)
  const { abierto: menuPerfil, setAbierto: setMenuPerfil, ref: perfilRef } = useDesplegable()

  const handleCerrarSesion = () => cerrarSesionDistribuidor(navigate)

  return (
    <div className="panel-shell">

      <Hdr
        menuBoton={
          <Boton
            variante="icono"
            className="panel-menu-btn"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            ☰
          </Boton>
        }
        logo={<span className="hdr-logo"><Marca /></span>}
        buscador
        buscadorValor={buscadorValor}
        onBuscadorChange={onBuscadorChange}
      >
        <Boton variante="fill" onClick={() => navigate('/inicioComprador')}>
          Salir de distribuidora
        </Boton>
        <CampanaNotificaciones rutaDestino="/pedidos" rutaDetalle="/pedidos" />
        <div className="desplegable-ancla" ref={perfilRef}>
          <Avatar nombre={nombre} onClick={() => setMenuPerfil(v => !v)} />
          {menuPerfil && (
            <div className="desplegable comprador-menu-desplegable">
              <div className="desplegable-item" onClick={handleCerrarSesion}>Cerrar sesión</div>
            </div>
          )}
        </div>
      </Hdr>

      {menuAbierto && (
        <div className="panel-drawer-overlay" onClick={() => setMenuAbierto(false)}>
          <nav className="panel-drawer" onClick={e => e.stopPropagation()}>
            <div className="panel-sidebar-marca">
              <Marca variante="panel" />
              <Boton variante="icono" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">✕</Boton>
            </div>
            <div className="panel-nav">
              <NavItems rutaActiva={rutaActiva} onNavegar={() => setMenuAbierto(false)} />
            </div>
          </nav>
        </div>
      )}

      <div className="panel-layout">

        <aside className="panel-sidebar">
          <div className="panel-sidebar-marca">
            <Marca variante="panel" />
            <span className="texto-mudo">Panel del Distribuidor</span>
          </div>

          <nav className="panel-nav">
            <NavItems rutaActiva={rutaActiva} />
          </nav>
        </aside>

        <main className="panel-main">
          <div className="panel-body">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}

export default PanelDistribuidor
