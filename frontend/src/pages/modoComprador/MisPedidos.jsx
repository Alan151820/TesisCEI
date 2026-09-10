import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { rutaInicio } from '../../lib/auth'
import { useCarrito } from '../../context/CarritoContext'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNavComprador from '../../components/BottomNavComprador'
import EstadoBadge from '../../components/EstadoBadge'
import MenuPerfilComprador from '../../components/MenuPerfilComprador'
import './InicioComprador.css'
import './MisPedidos.css'

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

      <header className="comprador-encabezado">
        <div className="comprador-logo" onClick={() => navigate(rutaInicio())}>MarketDist</div>
        <div className="comprador-buscador">
          <span className="comprador-buscador-icono">⌕</span>
          <input className="comprador-buscador-input" type="text" placeholder="Buscar productos…" />
        </div>
        <div className="comprador-acciones">
          <span className="comprador-nav-link" onClick={() => navigate('/misPedidos')}>Mis pedidos</span>
          <span className="comprador-nav-link" onClick={() => navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil')}>Distribuidora</span>
          <CampanaNotificaciones rutaDestino="/misPedidos" rutaDetalle="/pedido" />
          <button className="comprador-btn-carrito" onClick={() => navigate('/carrito')}>
            🛒{totalItems > 0 && <span className="comprador-carrito-badge">{totalItems}</span>}
          </button>
          <MenuPerfilComprador />
        </div>
      </header>

      <main className="mispedidos-main">

        <div className="mispedidos-encabezado">
          <h1 className="mispedidos-titulo">Mis pedidos</h1>
          <p className="mispedidos-subtitulo">Historial de todos tus pedidos.</p>
        </div>

        {cargando && (
          <div className="mispedidos-vacio">Cargando pedidos...</div>
        )}

        {!cargando && error && (
          <div className="mispedidos-vacio mispedidos-error">{error}</div>
        )}

        {!cargando && !error && pedidos.length === 0 && (
          <div className="mispedidos-vacio">Aún no realizaste pedidos.</div>
        )}

        {!cargando && !error && pedidos.length > 0 && (
          <>
            <div className="mispedidos-tabla">
              <div className="mispedidos-tabla-header">
                <div>Pedido</div>
                <div>Fecha</div>
                <div>Imagen</div>
                <div>Producto</div>
                <div>Distribuidor</div>
                <div>Total</div>
                <div>Estado</div>
              </div>
              {pedidos.map(p => (
                <div key={p.id} className="mispedidos-tabla-fila mispedidos-fila-clickeable" onClick={() => navigate(`/pedido/${p.id}`)}>
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
                  <div className="mispedidos-celda">${Number(p.total).toLocaleString('es-AR')}</div>
                  <div className="mispedidos-celda">
                    <EstadoBadge estado={p.estado} />
                  </div>
                </div>
              ))}
            </div>

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

      <BottomNavComprador />

    </div>
  )
}

export default MisPedidos
