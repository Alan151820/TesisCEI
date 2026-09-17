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
import Campo from '../../components/ui/Campo'
import GridCards from '../../components/ui/GridCards'
import CardProducto from '../../components/ui/CardProducto'
import EsqueletoTarjetas from '../../components/ui/EsqueletoTarjetas'
import EstadoLista from '../../components/ui/EstadoLista'
import './InicioComprador.css'
import Marca from '../../components/Marca'

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
        logo={<span className="hdr-logo" onClick={() => navigate(rutaInicio())}><Marca /></span>}
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

      <div className="fila gap-m comprador-filtros">
        <Campo
          as="select"
          className="comprador-filtro-campo"
          value={filtroCategoria}
          onChange={e => { setFiltroCategoria(e.target.value); aplicarFiltros({ categoria: e.target.value }) }}
        >
          <option value=''>Categoría</option>
          {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </Campo>

        <Campo
          className="comprador-filtro-campo"
          type="text"
          placeholder="Distribuidor"
          value={filtroDistribuidor}
          onChange={e => { setFiltroDistribuidor(e.target.value); aplicarFiltros({ distribuidor: e.target.value }) }}
        />

        <Campo
          className="comprador-filtro-campo"
          type="number"
          placeholder="Precio mínimo"
          value={filtroPrecioMin}
          onChange={e => { setFiltroPrecioMin(e.target.value); aplicarFiltros({ precioMinimo: e.target.value }) }}
        />

        <Campo
          className="comprador-filtro-campo"
          type="number"
          placeholder="Precio máximo"
          value={filtroPrecioMax}
          onChange={e => { setFiltroPrecioMax(e.target.value); aplicarFiltros({ precioMaximo: e.target.value }) }}
        />

        {hayFiltros && <button type="button" className="link" onClick={limpiarFiltros}>Limpiar filtros</button>}
      </div>

      <main className="comprador-contenido">

        {cargando && <GridCards><EsqueletoTarjetas /></GridCards>}

        {!cargando && productos.length === 0 && (
          <EstadoLista>
            {hayFiltros ? 'No se encontraron productos con los filtros aplicados.' : 'No hay productos disponibles en este momento.'}
          </EstadoLista>
        )}

        {!cargando && productos.length > 0 && (
          <>
            <GridCards>
              {productos.map(p => (
                <CardProducto
                  key={p.id}
                  producto={p}
                  onClick={() => navigate(`/producto/${p.id}`)}
                  onAgregar={agregarProducto}
                />
              ))}
            </GridCards>
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