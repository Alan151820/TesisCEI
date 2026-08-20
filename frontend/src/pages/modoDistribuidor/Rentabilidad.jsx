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

function formatearPesos(valor) {
  return `$${Number(valor).toLocaleString('es-AR')}`
}

function Rentabilidad() {
  const navigate = useNavigate()
  const location = useLocation()
  const nombre = localStorage.getItem('nombre') || ''
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  const [menuPerfil, setMenuPerfil] = useState(false)
  const perfilRef = useRef(null)

  const [lista, setLista] = useState([])
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
    api.get('/api/reportes/rentabilidad')
      .then(res => setLista(res.data))
      .catch(err => {
        setMensaje(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
      })
      .finally(() => setCargando(false))
  }, [])

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/login')
  }

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
              <span className="reportes-subnav-item" onClick={() => navigate('/reportes')}>Rendimiento</span>
              <span className="reportes-subnav-item activo" onClick={() => navigate('/reportes/rentabilidad')}>Rentabilidad</span>
            </div>

            <div className="panel-seccion-header">
              <div>
                <h1 className="panel-h1">Rentabilidad por precio por volumen</h1>
                <p className="panel-subtitulo">Comparación entre precio de venta y precio de costo por tramo.</p>
              </div>
            </div>

            {mensaje && <p className="reportes-vacio">{mensaje}</p>}
            {cargando && !mensaje && <p className="reportes-vacio">Cargando...</p>}

            {!cargando && !mensaje && lista.length === 0 && (
              <p className="reportes-vacio">Todavía no tenés precios por volumen registrados.</p>
            )}

            {!cargando && !mensaje && lista.length > 0 && (
              <div className="reportes-rentabilidad-wrapper">
                <div className="reportes-rentabilidad-header">
                  <div>Producto</div>
                  <div>Cant. mín.</div>
                  <div>Precio venta</div>
                  <div>Precio costo</div>
                  <div>Diferencia $</div>
                  <div>Diferencia %</div>
                </div>
                {lista.map(r => (
                  <div className="reportes-rentabilidad-fila" key={r.precioVolumenId}>
                    <div>{r.productoNombre}</div>
                    <div>{r.cantidadMinima} u.</div>
                    <div>{formatearPesos(r.precioVenta)}</div>
                    {r.tienePrecioCostoRegistrado ? (
                      <>
                        <div>{formatearPesos(r.precioCosto)}</div>
                        <div>{formatearPesos(r.diferenciaPesos)}</div>
                        <div>{r.diferenciaPorcentaje != null ? `${r.diferenciaPorcentaje.toFixed(1)}%` : '—'}</div>
                      </>
                    ) : (
                      <>
                        <div className="reportes-sin-costo">— Sin precio de costo</div>
                        <div>—</div>
                        <div>—</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>

      </div>
    </div>
  )
}

export default Rentabilidad
