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
  { label: 'Editar perfil', ruta: '/editarPerfil' },
]

function sufijoPorTipo(tipoProducto, metricaVisualizacion) {
  if (tipoProducto === 'fraccionable') {
    if (metricaVisualizacion === 'kilogramos') return 'kg'
    if (metricaVisualizacion === 'litros') return 'L'
    if (metricaVisualizacion === 'metros') return 'm'
  }
  return 'u.'
}

function Inicio() {
  const navigate = useNavigate()
  const location = useLocation()
  const nombre = localStorage.getItem('nombre') || ''
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorVisibilidad, setErrorVisibilidad] = useState({})
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroVisibilidad, setFiltroVisibilidad] = useState('')
  const [filtroStock, setFiltroStock] = useState('')

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  const cargarProductos = async (categoria = '', visibilidad = '', stock = '') => {
    setCargando(true)
    try {
      const params = {}
      if (categoria) params.categoria = categoria
      if (visibilidad) params.visibilidad = visibilidad
      if (stock) params.stock = stock
      const res = await axios.get('http://localhost:3000/api/productos', { headers, params })
      setProductos(res.data)
    } catch {
      setProductos([])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarProductos()
    axios.get('http://localhost:3000/api/productos/categorias', { headers })
      .then(res => setCategorias(res.data))
      .catch(() => {})
  }, [])

  const filtrarPorCategoria = (e) => {
    setFiltroCategoria(e.target.value)
    cargarProductos(e.target.value, filtroVisibilidad, filtroStock)
  }

  const filtrarPorVisibilidad = (e) => {
    setFiltroVisibilidad(e.target.value)
    cargarProductos(filtroCategoria, e.target.value, filtroStock)
  }

  const filtrarPorStock = (e) => {
    setFiltroStock(e.target.value)
    cargarProductos(filtroCategoria, filtroVisibilidad, e.target.value)
  }

  const limpiarFiltros = () => {
    setFiltroCategoria('')
    setFiltroVisibilidad('')
    setFiltroStock('')
    cargarProductos()
  }

  const handleCambiarVisibilidad = async (productoId, nuevoEstado) => {
    setErrorVisibilidad(prev => ({ ...prev, [productoId]: null }))
    try {
      const res = await axios.patch(
        `http://localhost:3000/api/productos/${productoId}/visibilidad`,
        { nuevoEstado },
        { headers }
      )
      const productoActualizado = res.data.producto
      setProductos(prev =>
        prev.map(p =>
          p.id === productoId ? { ...p, estadoVisibilidad: productoActualizado.estadoVisibilidad } : p
        )
      )
    } catch (err) {
      const mensaje = err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'
      setErrorVisibilidad(prev => ({ ...prev, [productoId]: mensaje }))
    }
  }

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
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
              <h1 className="panel-h1">Mis productos</h1>
              <p className="panel-subtitulo">Gestioná el catálogo de tu distribuidora.</p>
            </div>
            <button className="panel-btn-nuevo" onClick={() => navigate('/producto/nuevo')}>
              + Nuevo producto
            </button>
          </div>

          <div className="panel-filtros">
            <select className="panel-filtro-chip" value={filtroCategoria} onChange={filtrarPorCategoria}>
              <option value=''>Categoría</option>
              {categorias.map(c => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>

            <select className="panel-filtro-chip" value={filtroVisibilidad} onChange={filtrarPorVisibilidad}>
              <option value=''>Visibilidad</option>
              <option value='publicado'>Publicado</option>
              <option value='pausado'>Pausado</option>
            </select>

            <select className="panel-filtro-chip" value={filtroStock} onChange={filtrarPorStock}>
              <option value=''>Stock</option>
              <option value='con_stock'>Con stock</option>
              <option value='sin_stock'>Sin stock</option>
            </select>

            <div className="panel-filtro-limpiar" onClick={limpiarFiltros}>Limpiar filtros</div>
          </div>

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
                {filtroCategoria || filtroVisibilidad || filtroStock
                  ? 'No hay productos que coincidan con los filtros aplicados.'
                  : <>Aún no tenés productos. Creá el primero con el botón{' '}
                    <span className="panel-tabla-vacio-link" onClick={() => navigate('/producto/nuevo')}>
                      + Nuevo producto
                    </span>.</>
                }
              </div>
            )}

            {!cargando && productos.map(p => (
              <div key={p.id}>
                <div className="panel-tabla-fila">
                  <div className="panel-tabla-celda">
                    {p.imagenUrl
                      ? <img src={`http://localhost:3000${p.imagenUrl}`} alt={p.nombre} className="panel-producto-foto-img" />
                      : <div className="panel-producto-foto">—</div>
                    }
                  </div>
                  <div className="panel-tabla-celda">{p.nombre}</div>
                  <div className="panel-tabla-celda">{p.categoria}</div>
                  <div className={`panel-tabla-celda${p.stockDisponible === 0 ? ' stock-cero' : ''}`}>
                    {p.stockDisponible === 0 ? 'Sin stock disponible.' : `${p.stockDisponible} ${sufijoPorTipo(p.tipoProducto, p.metricaVisualizacion)}`}
                  </div>
                  <div className="panel-tabla-celda">{p.stockReservado} {sufijoPorTipo(p.tipoProducto, p.metricaVisualizacion)}</div>
                  <div className="panel-tabla-celda">
                    <span className={`panel-estado-badge ${p.estadoVisibilidad}`}>
                      {p.estadoVisibilidad === 'publicado' ? 'Publicado' : 'Pausado'}
                    </span>
                  </div>
                  <div className="panel-tabla-celda panel-acciones">
                    {p.estadoVisibilidad === 'publicado' ? (
                      <span className="panel-accion-link" onClick={() => handleCambiarVisibilidad(p.id, 'pausado')}>Pausar</span>
                    ) : (
                      <span className="panel-accion-link" onClick={() => handleCambiarVisibilidad(p.id, 'publicado')}>Publicar</span>
                    )}
                    {' · '}
                    <span className="panel-accion-link" onClick={() => navigate(`/producto/editar/${p.id}`)}>Editar</span>
                  </div>
                </div>
                {errorVisibilidad[p.id] && (
                  <div className="panel-error-visibilidad">{errorVisibilidad[p.id]}</div>
                )}
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
    </div>
  )
}

export default Inicio