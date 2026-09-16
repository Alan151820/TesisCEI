import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import BottomNav from '../components/BottomNav'
import Hdr from '../components/Hdr'
import Boton from '../components/ui/Boton'
import Campo from '../components/ui/Campo'
import GridCards from '../components/ui/GridCards'
import CardProducto from '../components/ui/CardProducto'
import EsqueletoTarjetas from '../components/ui/EsqueletoTarjetas'
import EstadoLista from '../components/ui/EstadoLista'
import api from '../lib/axios'
import './Catalogo.css'
import Marca from '../components/Marca'

function Catalogo() {
  const navigate = useNavigate()

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const { agregarProducto, totalItems } = useCarrito()
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

      <Hdr
        logo={<span className="hdr-logo" onClick={() => navigate('/')}><Marca /></span>}
        buscador
        buscadorValor={busqueda}
        onBuscadorChange={(valor) => { setBusqueda(valor); aplicarFiltros({ nombre: valor }) }}
      >
        <Boton variante="icono" className="hdr-btn-carrito" badge={totalItems} onClick={() => navigate('/carrito')} aria-label="Carrito">🛒</Boton>
        <Boton variante="ghost" className="catalogo-btn-auth" onClick={() => navigate('/login')}>Iniciar sesión</Boton>
        <Boton variante="fill" className="catalogo-btn-auth" onClick={() => navigate('/registro')}>Registrarse</Boton>
      </Hdr>

      <div className="fila gap-m p-m catalogo-filtros">
        <Campo
          as="select"
          className="catalogo-filtro-campo"
          value={filtroCategoria}
          onChange={e => { setFiltroCategoria(e.target.value); aplicarFiltros({ categoria: e.target.value }) }}
        >
          <option value=''>Categoría</option>
          {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </Campo>

        <Campo
          className="catalogo-filtro-campo"
          type="text"
          placeholder="Distribuidor"
          value={filtroDistribuidor}
          onChange={e => { setFiltroDistribuidor(e.target.value); aplicarFiltros({ distribuidor: e.target.value }) }}
        />

        <Campo
          className="catalogo-filtro-campo"
          type="number"
          placeholder="Precio mínimo"
          value={filtroPrecioMin}
          onChange={e => { setFiltroPrecioMin(e.target.value); aplicarFiltros({ precioMinimo: e.target.value }) }}
        />

        <Campo
          className="catalogo-filtro-campo"
          type="number"
          placeholder="Precio máximo"
          value={filtroPrecioMax}
          onChange={e => { setFiltroPrecioMax(e.target.value); aplicarFiltros({ precioMaximo: e.target.value }) }}
        />

        {hayFiltros && <button type="button" className="link" onClick={limpiarFiltros}>Limpiar filtros</button>}
      </div>

      <div className="catalogo-contenido">
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
            <div className="catalogo-contador">
              {productos.length} producto{productos.length !== 1 ? 's' : ''} disponible{productos.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>

      <BottomNav variante="publico" />

    </div>
  )
}

export default Catalogo