import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido, rutaInicio } from '../../lib/auth'
import { useCarrito } from '../../context/CarritoContext'
import { construirTituloProducto } from '../../lib/producto'
import './InicioComprador.css'

function InicioComprador() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem('nombre') || ''
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const { agregarProducto, totalItems } = useCarrito()
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

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('telefono')
    localStorage.removeItem('modoDistribuidorActivo')
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/catalogo', { replace: true })
  }

  return (
    <div className="comprador-layout">

      <header className="comprador-encabezado">
        <div className="comprador-logo" onClick={() => navigate(rutaInicio())}>MarketDist</div>
        <div className="comprador-buscador">
          <span className="comprador-buscador-icono">⌕</span>
          <input
            className="comprador-buscador-input"
            type="text"
            placeholder="Buscar productos…"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); aplicarFiltros({ nombre: e.target.value }) }}
          />
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

      <div className="comprador-filtros">
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

      <main className="comprador-contenido">

        {cargando && <div className="comprador-vacio">Cargando productos...</div>}

        {!cargando && productos.length === 0 && (
          <div className="comprador-vacio">
            {hayFiltros ? 'No se encontraron productos con los filtros aplicados.' : 'No hay productos disponibles en este momento.'}
          </div>
        )}

        {!cargando && productos.length > 0 && (
          <>
            <div className="comprador-grilla">
              {productos.map(p => (
                <div key={p.id} className="comprador-tarjeta" onClick={() => navigate(`/producto/${p.id}`)}>
                  {p.imagenUrl
                    ? <img src={`http://localhost:3000${p.imagenUrl}`} alt={p.nombre} className="comprador-tarjeta-imagen" />
                    : <div className="comprador-tarjeta-imagen-placeholder">Sin imagen</div>
                  }
                  <div className="comprador-tarjeta-cuerpo">
                    <div className="comprador-tarjeta-categoria">{p.categoria}</div>
                    <div className="comprador-tarjeta-nombre">{construirTituloProducto(p)}</div>
                    {p.descripcion && <div className="comprador-tarjeta-descripcion">{p.descripcion}</div>}
                    <div className="comprador-tarjeta-pie">
                      <div className="comprador-tarjeta-distribuidor">{p.nombreDistribuidor}</div>
                      <div className="comprador-tarjeta-precio">
                        <div>Desde ${Number(p.precioMinimo).toLocaleString('es-AR')}</div>
                        {Number(p.precioBase) > Number(p.precioMinimo) && (
                          <div className="comprador-tarjeta-precio-hasta">Hasta ${Number(p.precioBase).toLocaleString('es-AR')}</div>
                        )}
                      </div>
                    </div>
                    <button
                      className="comprador-tarjeta-agregar"
                      onClick={e => { e.stopPropagation(); agregarProducto(p) }}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="comprador-contador">
              {productos.length} producto{productos.length !== 1 ? 's' : ''} disponible{productos.length !== 1 ? 's' : ''}
            </div>
          </>
        )}

      </main>

      <nav className="comprador-bottom-nav">
        <div className="comprador-bottom-item activo">
          <span className="comprador-bottom-icono">◻</span>
          <span className="comprador-bottom-label">Catálogo</span>
        </div>
        <div className="comprador-bottom-item" onClick={() => navigate('/carrito')}>
          <span className="comprador-bottom-icono comprador-bottom-icono--carrito">
            🛒{totalItems > 0 && <span className="comprador-bottom-badge">{totalItems}</span>}
          </span>
          <span className="comprador-bottom-label">Carrito</span>
        </div>
        <div className="comprador-bottom-item" onClick={() => navigate('/misPedidos')}>
          <span className="comprador-bottom-icono">◇</span>
          <span className="comprador-bottom-label">Pedidos</span>
        </div>
      </nav>

    </div>
  )
}

export default InicioComprador