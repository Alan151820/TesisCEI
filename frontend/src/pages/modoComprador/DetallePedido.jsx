import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/axios'
import { rutaInicio } from '../../lib/auth'
import { useCarrito } from '../../context/CarritoContext'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNavComprador from '../../components/BottomNavComprador'
import EstadoBadge from '../../components/EstadoBadge'
import MenuPerfilComprador from '../../components/MenuPerfilComprador'
import './InicioComprador.css'
import './DetallePedido.css'

function formatearFecha(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DetallePedido() {
  const navigate = useNavigate()
  const { id } = useParams()
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const { totalItems } = useCarrito()

  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [cancelando, setCancelando] = useState(false)
  const [errorCancelar, setErrorCancelar] = useState('')

  useEffect(() => {
    api.get(`/api/pedidos/${id}`)
      .then(res => setPedido(res.data))
      .catch(err => setError(mensajeDeError(err)))
      .finally(() => setCargando(false))
  }, [id])

  // RF-069: el comprador cancela su propio pedido mientras esté Pendiente o
  // Aceptado. Sin motivo (es su propia decisión) pero con confirmación
  // previa por ser irreversible, igual que las acciones equivalentes del
  // lado distribuidor (ver DetalleReparto.jsx).
  const handleCancelar = async () => {
    if (!window.confirm('¿Cancelar este pedido? Esta acción no se puede deshacer.')) return
    setErrorCancelar('')
    setCancelando(true)
    try {
      await api.patch(`/api/pedidos/${id}/cancelar`)
      const res = await api.get(`/api/pedidos/${id}`)
      setPedido(res.data)
    } catch (err) {
      setErrorCancelar(mensajeDeError(err))
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="detallepedido-pagina">

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

      <main className="detallepedido-main">

        <div className="detallepedido-migas">
          <div className="detallepedido-migas-ruta">
            <span className="detallepedido-miga-link" onClick={() => navigate('/misPedidos')}>Mis pedidos</span>
            <span className="detallepedido-miga-separador">›</span>
            <span className="detallepedido-miga-actual">Pedido #{id}</span>
          </div>
          <button type="button" className="detallepedido-btn-volver" onClick={() => navigate('/misPedidos')}>Volver</button>
        </div>

        {cargando && (
          <div className="detallepedido-vacio">Cargando pedido...</div>
        )}

        {!cargando && error && (
          <div className="detallepedido-vacio detallepedido-error">{error}</div>
        )}

        {!cargando && !error && pedido && (
          <div className="detallepedido-tarjeta">
            <div className="detallepedido-encabezado-tarjeta">
              <div>
                <div className="detallepedido-numero">Pedido #{pedido.id}</div>
                <div className="detallepedido-subtitulo">
                  {pedido.nombreDistribuidor} · {formatearFecha(pedido.fechaCreacion)} · {pedido.direccionEntrega}
                </div>
              </div>
              <EstadoBadge estado={pedido.estado} className="detallepedido-estado" />
            </div>

            {pedido.estado === 'rechazado' && pedido.motivoRechazo && (
              <div className="detallepedido-motivo">Motivo del rechazo: {pedido.motivoRechazo}</div>
            )}

            <div className="detallepedido-tabla">
              <div className="detallepedido-tabla-header">
                <div>Producto</div>
                <div>Cantidad</div>
                <div>Precio unit.</div>
                <div>Subtotal</div>
              </div>
              {pedido.items.map((item, i) => (
                <div key={i} className="detallepedido-tabla-fila">
                  <div className="detallepedido-celda detallepedido-celda-producto">
                    {item.imagenUrl
                      ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombreProducto} className="detallepedido-thumb" />
                      : <span className="detallepedido-thumb detallepedido-thumb-sinimg">Sin imagen</span>
                    }
                    {item.disponible ? (
                      <button
                        type="button"
                        className="detallepedido-producto-boton"
                        onClick={() => navigate(`/producto/${item.productoId}`)}
                      >
                        {item.nombreProducto}
                      </button>
                    ) : (
                      <span className="detallepedido-producto-nodisponible">
                        {item.nombreProducto} <em>(No disponible)</em>
                      </span>
                    )}
                  </div>
                  <div className="detallepedido-celda">{Number(item.cantidad)} u.</div>
                  <div className="detallepedido-celda">${Number(item.precioVentaCongelado).toLocaleString('es-AR')}</div>
                  <div className="detallepedido-celda">${(Number(item.cantidad) * Number(item.precioVentaCongelado)).toLocaleString('es-AR')}</div>
                </div>
              ))}
              <div className="detallepedido-total">
                Total: ${Number(pedido.total).toLocaleString('es-AR')}
              </div>
            </div>

            {(pedido.estado === 'pendiente' || pedido.estado === 'aceptado') && (
              <>
                <button
                  type="button"
                  className="pedidos-accion-btn pedidos-accion-btn--peligro"
                  disabled={cancelando}
                  onClick={handleCancelar}
                >
                  {cancelando ? 'Cancelando...' : 'Cancelar pedido'}
                </button>

                {errorCancelar && <div className="pedidos-error-accion">{errorCancelar}</div>}
              </>
            )}
          </div>
        )}

      </main>

      <BottomNavComprador />

    </div>
  )
}

export default DetallePedido
