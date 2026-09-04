import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import ModalMapaDireccion from '../../components/ModalMapaDireccion'
import EstadoBadge from '../../components/EstadoBadge'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import { ETIQUETA_ESTADO } from '../../lib/pedido'
import './Inicio.css'
import './MisPedidos.css'

const ESTADOS_PEDIDO = ['pendiente', 'aceptado', 'en_camino', 'rechazado', 'cancelado', 'entregado']

function formatearFecha(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function FilaPedido({ pedido: p, onVerUbicacion, navigate }) {
  return (
    <div className="pedidos-tabla-fila pedidos-fila-clickeable" onClick={() => navigate(`/pedidos/${p.id}`)}>
      <div className="pedidos-celda pedidos-numero">#{p.id}</div>
      <div className="pedidos-celda">{formatearFecha(p.fechaCreacion)}</div>
      <div className="pedidos-celda">{p.nombreComprador}</div>
      <div className="pedidos-celda">
        <div className="pedidos-productos-lista">
          {p.items.map((item, i) => (
            <div key={i} className="pedidos-producto-item pedidos-producto-item--imagen">
              {item.imagenUrl
                ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombreProducto} className="pedidos-thumb" />
                : <span className="pedidos-thumb pedidos-thumb-sinimg">Sin imagen</span>
              }
              <span>{item.nombreProducto} ×{Number(item.cantidad)} u.</span>
            </div>
          ))}
        </div>
      </div>
      <div className="pedidos-celda pedidos-celda--derecha">${Number(p.total).toLocaleString('es-AR')}</div>
      <div className="pedidos-celda pedidos-celda--centro">
        <EstadoBadge estado={p.estado} />
      </div>
      <div className="pedidos-celda">
        <div className="pedidos-acciones" onClick={e => e.stopPropagation()}>
          {p.latitud && p.longitud && (
            <button type="button" className="pedidos-accion-btn" onClick={() => onVerUbicacion(p)}>
              Ver ubicación
            </button>
          )}
          <button
            type="button"
            className="pedidos-accion-btn"
            onClick={() => window.open(`https://wa.me/${p.telefonoComprador.replace(/^\+/, '')}`, '_blank')}
          >
            Mensaje
          </button>
        </div>
      </div>
    </div>
  )
}

function MisPedidos() {
  const navigate = useNavigate()

  // RF-029/RF-051: un único panel con todos los pedidos, en cualquier
  // estado — ya no hay pestañas separadas "Activos"/"Historial". El orden
  // (Pendiente, Aceptado, el resto) lo arma el backend.
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [pedidoMapa, setPedidoMapa] = useState(null)

  // Filtros: se aplican en el navegador sobre el panel único ya cargado —
  // no hay paginación de por medio, no vale la pena ir y volver al server.
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [filtroTotalMinimo, setFiltroTotalMinimo] = useState('')
  const [filtroTotalMaximo, setFiltroTotalMaximo] = useState('')

  const hayFiltros = filtroCliente || filtroEstado || filtroFechaDesde || filtroFechaHasta || filtroTotalMinimo || filtroTotalMaximo

  const limpiarFiltros = () => {
    setFiltroCliente('')
    setFiltroEstado('')
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
    setFiltroTotalMinimo('')
    setFiltroTotalMaximo('')
  }

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroCliente && !p.nombreComprador.toLowerCase().includes(filtroCliente.toLowerCase())) return false
    if (filtroEstado && p.estado !== filtroEstado) return false
    const fechaPedido = p.fechaCreacion.slice(0, 10)
    if (filtroFechaDesde && fechaPedido < filtroFechaDesde) return false
    if (filtroFechaHasta && fechaPedido > filtroFechaHasta) return false
    if (filtroTotalMinimo && Number(p.total) < Number(filtroTotalMinimo)) return false
    if (filtroTotalMaximo && Number(p.total) > Number(filtroTotalMaximo)) return false
    return true
  })

  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  useEffect(() => {
    api.get('/api/pedidos/historial')
      .then(res => setPedidos(res.data))
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }, [])

  return (
    <PanelDistribuidor tituloMobile="Pedidos">
            <div className="panel-contenido-centrado">

            <div className="panel-seccion-header">
              <div>
                <h1 className="panel-h1">Pedidos</h1>
                <p className="panel-subtitulo">
                  Todos tus pedidos, primero los que necesitan acción (Pendiente, Aceptado) y después el resto.
                </p>
              </div>
            </div>

            {!cargando && !error && pedidos.length > 0 && (
              <div className="panel-filtros pedidos-filtros">
                <input
                  type="text"
                  className="panel-filtro-chip pedidos-filtro-texto"
                  placeholder="Buscar por cliente…"
                  value={filtroCliente}
                  onChange={e => setFiltroCliente(e.target.value)}
                />

                <select className="panel-filtro-chip" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                  <option value=''>Estado</option>
                  {ESTADOS_PEDIDO.map(estado => (
                    <option key={estado} value={estado}>{ETIQUETA_ESTADO[estado]}</option>
                  ))}
                </select>

                <div className="pedidos-filtro-rango">
                  <input
                    type="date"
                    className="panel-filtro-chip"
                    aria-label="Fecha desde"
                    value={filtroFechaDesde}
                    onChange={e => setFiltroFechaDesde(e.target.value)}
                  />
                  <span className="pedidos-filtro-rango-sep">–</span>
                  <input
                    type="date"
                    className="panel-filtro-chip"
                    aria-label="Fecha hasta"
                    value={filtroFechaHasta}
                    onChange={e => setFiltroFechaHasta(e.target.value)}
                  />
                </div>

                <div className="pedidos-filtro-rango">
                  <input
                    type="number"
                    min="0"
                    className="panel-filtro-chip pedidos-filtro-numero"
                    placeholder="Total mín."
                    value={filtroTotalMinimo}
                    onChange={e => setFiltroTotalMinimo(e.target.value)}
                  />
                  <span className="pedidos-filtro-rango-sep">–</span>
                  <input
                    type="number"
                    min="0"
                    className="panel-filtro-chip pedidos-filtro-numero"
                    placeholder="Total máx."
                    value={filtroTotalMaximo}
                    onChange={e => setFiltroTotalMaximo(e.target.value)}
                  />
                </div>

                {hayFiltros && (
                  <div className="panel-filtro-limpiar" onClick={limpiarFiltros}>Limpiar filtros</div>
                )}
              </div>
            )}

            {cargando && (
              <div className="panel-tabla-vacio">Cargando pedidos...</div>
            )}

            {!cargando && error && (
              <div className="panel-tabla-vacio pedidos-error">{error}</div>
            )}

            {!cargando && !error && pedidos.length === 0 && (
              <div className="panel-tabla-vacio">Aún no recibiste pedidos.</div>
            )}

            {!cargando && !error && pedidos.length > 0 && pedidosFiltrados.length === 0 && (
              <div className="panel-tabla-vacio">No hay pedidos que coincidan con los filtros aplicados.</div>
            )}

            {!cargando && !error && pedidosFiltrados.length > 0 && (
              <div className="panel-tabla-wrapper">
                <div className="pedidos-tabla-header">
                  <div>Pedido</div>
                  <div>Fecha</div>
                  <div>Comprador</div>
                  <div>Productos</div>
                  <div className="pedidos-celda--derecha">Total</div>
                  <div className="pedidos-celda--centro">Estado</div>
                  <div></div>
                </div>

                {pedidosFiltrados.map(p => (
                  <FilaPedido key={p.id} pedido={p} onVerUbicacion={setPedidoMapa} navigate={navigate} />
                ))}

                <div className="panel-tabla-contador">
                  {pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? 's' : ''}
                  {hayFiltros ? ` de ${pedidos.length} en total` : ' en total'}
                </div>
              </div>
            )}

            </div>

      {pedidoMapa && (
        <ModalMapaDireccion
          soloLectura
          ubicacionInicial={{ lat: Number(pedidoMapa.latitud), lng: Number(pedidoMapa.longitud) }}
          direccionInicial={pedidoMapa.direccionEntrega}
          onCerrar={() => setPedidoMapa(null)}
        />
      )}
    </PanelDistribuidor>
  )
}

export default MisPedidos
