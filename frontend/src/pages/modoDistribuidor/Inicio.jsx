import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import './Inicio.css'

const NAV_ITEMS = [
  { label: 'Pedidos', ruta: '/pedidos' },
  { label: 'Productos', ruta: '/inicio' },
  { label: 'Proveedores', ruta: '/proveedores' },
  { label: 'Reparto', ruta: '/reparto' },
  { label: 'Reportes', ruta: '/reportes' },
  { label: 'Empleados', ruta: '/empleados' },
  { label: 'Configuración', ruta: '/configuracion' },
]

function Inicio() {
  const navigate = useNavigate()
  const location = useLocation()
  const nombre = localStorage.getItem('nombre') || ''
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    axios
      .get('http://localhost:3000/api/productos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setProductos(res.data))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    navigate('/login')
  }

  return (
    <div className="panel-layout">

      {/* Sidebar */}
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
          <button className='panel-nav-item' onClick={() => navigate('/inicioComprador')}>Cambiar a modo comprador</button>

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

      {/* Contenido principal */}
      <main className="panel-main">

        {/* Topbar */}
        <header className="panel-topbar">
          <span className="panel-topbar-titulo">Panel del Distribuidor</span>
          <div className="panel-avatar">{iniciales}</div>
        </header>

        {/* Área de contenido */}
        <div className="panel-contenido">

          {/* Encabezado sección */}
          <div className="panel-seccion-header">
            <div>
              <h1 className="panel-h1">Mis productos</h1>
              <p className="panel-subtitulo">Gestioná el catálogo de tu distribuidora.</p>
            </div>
            <button
              className="panel-btn-nuevo"
              onClick={() => navigate('/producto/nuevo')}
            >
              + Nuevo producto
            </button>
          </div>

          {/* Filtros */}
          <div className="panel-filtros">
            <div className="panel-filtro-chip">Categoría ▾</div>
            <div className="panel-filtro-chip">Visibilidad ▾</div>
            <div className="panel-filtro-chip">Stock ▾</div>
            <div className="panel-filtro-limpiar">Limpiar filtros</div>
          </div>

          {/* Tabla */}
          <div className="panel-tabla-wrapper">
            <div className="panel-tabla-header">
              <div></div>
              <div>Producto</div>
              <div>Categoría</div>
              <div>Stock disp.</div>
              <div>Stock res.</div>
              <div>Estado</div>
              <div>Acciones</div>
            </div>

            {cargando && (
              <div className="panel-tabla-vacio">Cargando productos...</div>
            )}

            {!cargando && productos.length === 0 && (
              <div className="panel-tabla-vacio">
                Aún no tenés productos. Creá el primero con el botón{' '}
                <span
                  className="panel-tabla-vacio-link"
                  onClick={() => navigate('/producto/nuevo')}
                >
                  + Nuevo producto
                </span>
                .
              </div>
            )}

            {!cargando && productos.map(p => (
              <div key={p.id} className="panel-tabla-fila">
                <div className="panel-tabla-celda">
                  {p.imagenUrl
                    ? <img src={`http://localhost:3000${p.imagenUrl}`} alt={p.nombre} className="panel-producto-foto-img" />
                    : <div className="panel-producto-foto">—</div>
                  }
                </div>
                <div className="panel-tabla-celda">{p.nombre}</div>
                <div className="panel-tabla-celda">{p.categoria}</div>
                <div className={`panel-tabla-celda${p.stockDisponible === 0 ? ' stock-cero' : ''}`}>
                  {p.stockDisponible} u.
                </div>
                <div className="panel-tabla-celda">{p.stockReservado} u.</div>
                <div className="panel-tabla-celda">
                  <span className={`panel-estado-badge ${p.estadoVisibilidad}`}>
                    {p.estadoVisibilidad === 'publicado' ? 'Publicado' : 'Pausado'}
                  </span>
                </div>
                <div className="panel-tabla-celda panel-acciones">
                  {p.estadoVisibilidad === 'publicado' ? 'Pausar' : 'Publicar'} · Editar
                </div>
              </div>
            ))}
          </div>

          {!cargando && productos.length > 0 && (
            <div className="panel-tabla-contador">
              Mostrando {productos.length} producto{productos.length !== 1 ? 's' : ''}
            </div>
          )}

        </div>
      </main>

    </div>
  )
}

export default Inicio
