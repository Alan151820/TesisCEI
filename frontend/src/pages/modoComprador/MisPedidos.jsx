import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { rutaInicio } from '../../lib/auth'
import { useCarrito } from '../../context/CarritoContext'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNav from '../../components/BottomNav'
import EstadoBadge from '../../components/EstadoBadge'
import MenuPerfilComprador from '../../components/MenuPerfilComprador'
import Hdr from '../../components/Hdr'
import Boton from '../../components/ui/Boton'
import Tabla from '../../components/ui/Tabla'
import TablaHeader from '../../components/ui/TablaHeader'
import TablaFila from '../../components/ui/TablaFila'
import EsqueletoFilas from '../../components/ui/EsqueletoFilas'
import EstadoLista from '../../components/ui/EstadoLista'
import './InicioComprador.css'
import './MisPedidos.css'
import Marca from '../../components/Marca'

const COLUMNAS = [
  'Pedido', 'Fecha', 'Imagen', 'Producto', 'Distribuidor',
  { label: 'Total', className: 'mispedidos-celda--derecha' },
  { label: 'Estado', className: 'mispedidos-celda--centro' },
]
const GRID = '70px 100px 72px minmax(200px,1fr) 160px 100px 120px'

function formatearFecha(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function MisPedidos() {
  const navigate = useNavigate()
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const { totalItems } = useCarrito()

  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/pedidos/mis-pedidos')
      .then(res => setPedidos(res.data))
      .catch(err => setError(mensajeDeError(err)))
      .finally(() => setCargando(false))
  }, [])


  return (
    <div className="mispedidos-pagina">

      <Hdr logo={<span className="hdr-logo" onClick={() => navigate(rutaInicio())}><Marca /></span>} buscador>
        <span className="link comprador-nav-link" onClick={() => navigate('/misPedidos')}>Mis pedidos</span>
        <span className="link comprador-nav-link" onClick={() => navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil')}>Distribuidora</span>
        <CampanaNotificaciones rutaDestino="/misPedidos" rutaDetalle="/pedido" />
        <Boton variante="icono" className="hdr-btn-carrito" badge={totalItems} onClick={() => navigate('/carrito')} aria-label="Carrito">🛒</Boton>
        <MenuPerfilComprador />
      </Hdr>

      <main className="mispedidos-main">

        <div className="mispedidos-encabezado">
          <h1 className="mispedidos-titulo">Mis pedidos</h1>
          <p className="mispedidos-subtitulo">Historial de todos tus pedidos.</p>
        </div>

        {cargando && (
          <Tabla grid={GRID}>
            <TablaHeader columnas={COLUMNAS} />
            <EsqueletoFilas columnas={COLUMNAS.length} />
          </Tabla>
        )}

        {!cargando && error && (
          <EstadoLista variante="error">{error}</EstadoLista>
        )}

        {!cargando && !error && pedidos.length === 0 && (
          <EstadoLista>Aún no realizaste pedidos.</EstadoLista>
        )}

        {!cargando && !error && pedidos.length > 0 && (
          <>
            <Tabla className="mispedidos-tabla" grid={GRID}>
              <TablaHeader columnas={COLUMNAS} />
              {pedidos.map(p => (
                <TablaFila key={p.id} onClick={() => navigate(`/pedido/${p.id}`)}>
                  <div className="mispedidos-celda mispedidos-celda-id">#{p.id}</div>
                  <div className="mispedidos-celda">{formatearFecha(p.fechaCreacion)}</div>
                  <div className="mispedidos-celda mispedidos-celda-col">
                    {p.items.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        className="mispedidos-thumb"
                        onClick={(e) => { e.stopPropagation(); navigate(`/producto/${item.productoId}`) }}
                        aria-label={`Ver ${item.nombreProducto}`}
                      >
                        {item.imagenUrl
                          ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombreProducto} className="mispedidos-thumb-img" />
                          : <span className="mispedidos-thumb-sinimg">Sin imagen</span>
                        }
                      </button>
                    ))}
                  </div>
                  <div className="mispedidos-celda mispedidos-celda-col">
                    {p.items.map((item, i) => (
                      <div key={i} className="mispedidos-item-linea">
                        {item.disponible ? (
                          <button
                            type="button"
                            className="mispedidos-titulo-link"
                            onClick={(e) => { e.stopPropagation(); navigate(`/producto/${item.productoId}`) }}
                          >
                            {item.nombreProducto}
                          </button>
                        ) : (
                          <span className="mispedidos-titulo-nodisponible">
                            {item.nombreProducto} <em>(No disponible)</em>
                          </span>
                        )}
                        <span className="mispedidos-cantidad">{Number(item.cantidad)} u.</span>
                      </div>
                    ))}
                  </div>
                  <div className="mispedidos-celda mispedidos-celda-col">
                    <div>{p.nombreDistribuidor}</div>
                  </div>
                  <div className="mispedidos-celda mispedidos-celda--derecha">${Number(p.total).toLocaleString('es-AR')}</div>
                  <div className="mispedidos-celda mispedidos-celda--centro">
                    <EstadoBadge estado={p.estado} />
                  </div>
                </TablaFila>
              ))}
            </Tabla>

            <div className="mispedidos-cards">
              {pedidos.map(p => (
                <div key={p.id} className="mispedidos-card mispedidos-fila-clickeable" onClick={() => navigate(`/pedido/${p.id}`)}>
                  <div className="mispedidos-card-fila">
                    <span className="mispedidos-card-id">Pedido #{p.id}</span>
                    <EstadoBadge estado={p.estado} />
                  </div>
                  <div className="mispedidos-card-fila">
                    <span className="mispedidos-card-fecha">{formatearFecha(p.fechaCreacion)}</span>
                  </div>
                  <div className="mispedidos-card-fila">
                    <span className="mispedidos-card-distribuidor">{p.nombreDistribuidor}</span>
                  </div>
                  {p.items.map((item, i) => (
                    <div key={i} className="mispedidos-card-item">
                      <button
                        type="button"
                        className="mispedidos-thumb"
                        onClick={(e) => { e.stopPropagation(); navigate(`/producto/${item.productoId}`) }}
                        aria-label={`Ver ${item.nombreProducto}`}
                      >
                        {item.imagenUrl
                          ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombreProducto} className="mispedidos-thumb-img" />
                          : <span className="mispedidos-thumb-sinimg">Sin imagen</span>
                        }
                      </button>
                      <div className="mispedidos-card-item-info">
                        {item.disponible ? (
                          <button
                            type="button"
                            className="mispedidos-titulo-link"
                            onClick={(e) => { e.stopPropagation(); navigate(`/producto/${item.productoId}`) }}
                          >
                            {item.nombreProducto}
                          </button>
                        ) : (
                          <span className="mispedidos-titulo-nodisponible">
                            {item.nombreProducto} <em>(No disponible)</em>
                          </span>
                        )}
                        <span className="mispedidos-cantidad">
                          {Number(item.cantidad)} u.
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mispedidos-card-fila mispedidos-card-footer">
                    <span className="mispedidos-card-total-label">Total</span>
                    <span className="mispedidos-card-total">${Number(p.total).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </main>

      <BottomNav />

    </div>
  )
}

export default MisPedidos
