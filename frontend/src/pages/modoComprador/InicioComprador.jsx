import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { rutaInicio } from '../../lib/auth'
import { useCarrito } from '../../context/CarritoContext'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNav from '../../components/BottomNav'
import MenuPerfilComprador from '../../components/MenuPerfilComprador'
import Hdr from '../../components/Hdr'
import Boton from '../../components/ui/Boton'
import { construirTituloProducto } from '../../lib/producto'
import './InicioComprador.css'

function InicioComprador() {
  const navigate = useNavigate()
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const { agregarProducto, totalItems } = useCarrito()

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
    <div className="comprador-layout">

      <Hdr
        logo={<span className="hdr-logo" onClick={() => navigate(rutaInicio())}>MarketDist</span>}
        buscador
        buscadorValor={busqueda}
        onBuscadorChange={(valor) => { setBusqueda(valor); aplicarFiltros({ nombre: valor }) }}
      >
        <span className="link comprador-nav-link" onClick={() => navigate('/misPedidos')}>Mis pedidos</span>
        <span className="link comprador-nav-link" onClick={() => navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil')}>Distribuidora</span>
        <CampanaNotificaciones rutaDestino="/misPedidos" rutaDetalle="/pedido" />
        <Boton variante="icono" className="hdr-btn-carrito" badge={totalItems} onClick={() => navigate('/carrito')} aria-label="Carrito">🛒</Boton>
        <MenuPerfilComprador />
      </Hdr>

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

      <BottomNav />

    </div>
  )
}

export default InicioComprador