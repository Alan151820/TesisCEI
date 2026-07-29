import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import api from '../lib/axios'
import './Catalogo.css'

function Catalogo() {
  const navigate = useNavigate()

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const token = localStorage.getItem('token')
  const { agregarProducto, totalItems } = useCarrito()
  const [categorias, setCategorias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroDistribuidor, setFiltroDistribuidor] = useState('')
  const [filtroPrecioMin, setFiltroPrecioMin] = useState('')
  const [filtroPrecioMax, setFiltroPrecioMax] = useState('')

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [categorias, setCategorias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroDistribuidor, setFiltroDistribuidor] = useState('')
  const [filtroPrecioMin, setFiltroPrecioMin] = useState('')
  const [filtroPrecioMax, setFiltroPrecioMax] = useState('')

  useEffect(() => {
    cargarProductos()
    api.get('/api/productos/categorias')
      .then(res => setCategorias(res.data))
      .catch(() => {})
  }, [])

  const cargarProductos = async (params = {}) => {
    setCargando(true)
    try {
      const res = await api.get('/api/catalogo', { params })
      setProductos(res.data)
    } catch {
      setProductos([])
    } finally {
      setCargando(false)
    }
  }

  const aplicarFiltros = (nuevosValores = {}) => {
    const params = {
      nombre: nuevosValores.nombre ?? busqueda,
      categoria: nuevosValores.categoria ?? filtroCategoria,
      distribuidor: nuevosValores.distribuidor ?? filtroDistribuidor,
      precioMinimo: nuevosValores.precioMinimo ?? filtroPrecioMin,
      precioMaximo: nuevosValores.precioMaximo ?? filtroPrecioMax,
    }
    cargarProductos(params)
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroCategoria('')
    setFiltroDistribuidor('')
    setFiltroPrecioMin('')
    setFiltroPrecioMax('')
    cargarProductos()
  }

  const hayFiltros = busqueda || filtroCategoria || filtroDistribuidor || filtroPrecioMin || filtroPrecioMax

  return (
    <div className="catalogo-layout">

      <header className="catalogo-header">
        <div className="catalogo-header-marca" onClick={() => navigate('/')}>MarketDist</div>
        <div className="catalogo-header-buscador">
          <span className="catalogo-header-buscador-icono">⌕</span>
          <input
            className="catalogo-header-buscador-input"
            type="text"
            placeholder="Buscar productos…"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); aplicarFiltros({ nombre: e.target.value }) }}
          />
        </div>
        <div className="catalogo-header-acciones">
          <button className="catalogo-btn-carrito" onClick={() => navigate('/carrito')}>
            🛒{totalItems > 0 && <span className="catalogo-carrito-badge">{totalItems}</span>}
          </button>
          <button className="catalogo-btn-login" onClick={() => navigate('/login')}>Iniciar sesión</button>
          <button className="catalogo-btn-registro" onClick={() => navigate('/registro')}>Registrarse</button>
        </div>
      </header>

      <div className="catalogo-filtros">
        <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); aplicarFiltros({ categoria: e.target.value }) }}>
          <option value=''>Categoría</option>
          {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>

        <input
          type="text"
          placeholder="Distribuidor"
          value={filtroDistribuidor}
          onChange={e => { setFiltroDistribuidor(e.target.value); aplicarFiltros({ distribuidor: e.target.value }) }}
        />

        <input
          type="number"
          placeholder="Precio mínimo"
          value={filtroPrecioMin}
          onChange={e => { setFiltroPrecioMin(e.target.value); aplicarFiltros({ precioMinimo: e.target.value }) }}
        />

        <input
          type="number"
          placeholder="Precio máximo"
          value={filtroPrecioMax}
          onChange={e => { setFiltroPrecioMax(e.target.value); aplicarFiltros({ precioMaximo: e.target.value }) }}
        />

        {hayFiltros && <button onClick={limpiarFiltros}>Limpiar filtros</button>}
      </div>

      <div className="catalogo-contenido">
        {cargando && <div className="catalogo-vacio">Cargando productos...</div>}

        {!cargando && productos.length === 0 && (
          <div className="catalogo-vacio">
            {hayFiltros ? 'No se encontraron productos con los filtros aplicados.' : 'No hay productos disponibles en este momento.'}
          </div>
        )}

        {!cargando && productos.length > 0 && (
          <>
            <div className="catalogo-grilla">
              {productos.map(p => (
                <div key={p.id} className="catalogo-tarjeta" onClick={() => navigate(`/producto/${p.id}`)}>
                  {p.imagenUrl
                    ? <img src={`http://localhost:3000${p.imagenUrl}`} alt={p.nombre} className="catalogo-tarjeta-imagen" />
                    : <div className="catalogo-tarjeta-imagen-placeholder">Sin imagen</div>
                  }
                  <div className="catalogo-tarjeta-cuerpo">
                    <div className="catalogo-tarjeta-categoria">{p.categoria}</div>
                    <div className="catalogo-tarjeta-nombre">{p.nombre}</div>
                    {p.descripcion && <div className="catalogo-tarjeta-descripcion">{p.descripcion}</div>}
                    <div className="catalogo-tarjeta-pie">
                      <div className="catalogo-tarjeta-distribuidor">{p.nombreDistribuidor}</div>
                      <div className="catalogo-tarjeta-precio">
                        Desde ${Number(p.precioMinimo).toLocaleString('es-AR')}
                      </div>
                    </div>
                    <button
                      className="catalogo-tarjeta-agregar"
                      onClick={e => { e.stopPropagation(); agregarProducto(p) }}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="catalogo-contador">
              {productos.length} producto{productos.length !== 1 ? 's' : ''} disponible{productos.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>

      <nav className="catalogo-bottom-nav">
        <div className="catalogo-bottom-item activo">
          <span className="catalogo-bottom-icono">◻</span>
          <span className="catalogo-bottom-label">Catálogo</span>
        </div>
        <div className="catalogo-bottom-item catalogo-bottom-carrito" onClick={() => navigate('/carrito')}>
          <span className="catalogo-bottom-icono">
            🛒{totalItems > 0 && <span className="catalogo-bottom-badge">{totalItems}</span>}
          </span>
          <span className="catalogo-bottom-label">Carrito</span>
        </div>
        {token ? (
          <div className="catalogo-bottom-item" onClick={() => navigate('/inicio')}>
            <span className="catalogo-bottom-icono">⊞</span>
            <span className="catalogo-bottom-label">Panel</span>
          </div>
        ) : (
          <div className="catalogo-bottom-item" onClick={() => navigate('/login')}>
            <span className="catalogo-bottom-icono">○</span>
            <span className="catalogo-bottom-label">Cuenta</span>
          </div>
        )}
      </nav>

    </div>
  )
}

export default Catalogo