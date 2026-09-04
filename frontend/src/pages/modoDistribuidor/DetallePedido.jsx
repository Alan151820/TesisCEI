import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import ModalMapaDireccion from '../../components/ModalMapaDireccion'
import EstadoBadge from '../../components/EstadoBadge'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import { ETIQUETA_ESTADO } from '../../lib/pedido'
import './Inicio.css'
import './MisPedidos.css'
import './DetallePedido.css'

const MOTIVOS_RECHAZO_PENDIENTE = [
  'Sin stock del producto solicitado',
  'Producto discontinuado',
  'Pedido fuera de la zona de entrega',
  'Error en los datos del pedido',
  'Distribuidora no disponible en la fecha solicitada',
]

function formatearFecha(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DetallePedido() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [errorAccion, setErrorAccion] = useState(null)
  const [modalRechazo, setModalRechazo] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [errorRechazo, setErrorRechazo] = useState(null)
  const [rechazando, setRechazando] = useState(false)
  const [modalMapa, setModalMapa] = useState(false)

  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  useEffect(() => {
    api.get(`/api/pedidos/${id}/detalle`)
      .then(res => setPedido(res.data))
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }, [id])

  const handleAceptar = async () => {
    setProcesando(true)
    setErrorAccion(null)
    try {
      const res = await api.patch(`/api/pedidos/${id}/aceptar`)
      setPedido(prev => ({ ...prev, estado: 'aceptado' }))
      window.open(res.data.deepLink, '_blank')
    } catch (err) {
      setErrorAccion(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setProcesando(false)
    }
  }

  const handleAvanzar = async () => {
    setProcesando(true)
    setErrorAccion(null)
    try {
      const res = await api.patch(`/api/pedidos/${id}/avanzar`)
      setPedido(prev => ({ ...prev, estado: res.data.estado }))
    } catch (err) {
      setErrorAccion(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setProcesando(false)
    }
  }

  const abrirModalRechazo = () => {
    setModalRechazo(true)
    setMotivoRechazo('')
    setErrorRechazo(null)
  }

  const cerrarModalRechazo = () => {
    setModalRechazo(false)
    setMotivoRechazo('')
    setErrorRechazo(null)
  }

  const handleConfirmarRechazo = async () => {
    const motivo = motivoRechazo.trim()
    if (!motivo) {
      setErrorRechazo('Ingresá un motivo de rechazo antes de confirmar.')
      return
    }
    setRechazando(true)
    setErrorRechazo(null)
    try {
      await api.patch(`/api/pedidos/${id}/rechazar`, { motivo })
      setPedido(prev => ({ ...prev, estado: 'rechazado', motivoRechazo: motivo }))
      cerrarModalRechazo()
    } catch (err) {
      setErrorRechazo(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setRechazando(false)
    }
  }

  return (
    <PanelDistribuidor tituloMobile={`Pedido #${id}`} activo="/pedidos">
            <div className="panel-contenido-centrado">

            <div className="detallepedido-migas">
              <div className="detallepedido-migas-ruta">
                <span className="detallepedido-miga-link" onClick={() => navigate('/pedidos')}>Pedidos activos</span>
                <span className="detallepedido-miga-separador">›</span>
                <span className="detallepedido-miga-actual">Pedido #{id}</span>
              </div>
              <button type="button" className="detallepedido-btn-volver" onClick={() => navigate('/pedidos')}>Volver</button>
            </div>

            {cargando && <div className="detallepedido-vacio">Cargando pedido...</div>}

            {!cargando && error && (
              <div className="detallepedido-vacio detallepedido-error">{error}</div>
            )}

            {!cargando && !error && pedido && (
              <>
                <div className="detallepedido-tarjeta">
                  <div className="detallepedido-encabezado-tarjeta">
                    <div>
                      <div className="detallepedido-numero">Pedido #{pedido.id}</div>
                      <div className="detallepedido-subtitulo">
                        {pedido.nombreComprador} · {pedido.telefonoComprador} · {formatearFecha(pedido.fechaCreacion)}
                      </div>
                      <div className="detallepedido-subtitulo">Entrega: {pedido.direccionEntrega}</div>
                    </div>
                    <EstadoBadge estado={pedido.estado} className="detallepedido-estado" />
                  </div>

                  {pedido.estado === 'rechazado' && pedido.motivoRechazo && (
                    <div className="detallepedido-motivo">Motivo del rechazo: {pedido.motivoRechazo}</div>
                  )}

                  <div className="detallepedido-tabla">
                    <div className="detallepedido-tabla-header detallepedido-tabla-header--dist">
                      <div>Producto</div>
                      <div>Cantidad</div>
                      <div>Precio unit.</div>
                      <div>Subtotal</div>
                      <div>Stock disp.</div>
                    </div>
                    {pedido.items.map((item, i) => (
                      <div key={i} className="detallepedido-tabla-fila detallepedido-tabla-fila--dist">
                        <div className="detallepedido-celda detallepedido-celda-producto">
                          {item.imagenUrl
                            ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombreProducto} className="detallepedido-thumb" />
                            : <span className="detallepedido-thumb detallepedido-thumb-sinimg">Sin imagen</span>
                          }
                          {item.nombreProducto}
                        </div>
                        <div className="detallepedido-celda">{Number(item.cantidad)} u.</div>
                        <div className="detallepedido-celda">${Number(item.precioVentaCongelado).toLocaleString('es-AR')}</div>
                        <div className="detallepedido-celda">${(Number(item.cantidad) * Number(item.precioVentaCongelado)).toLocaleString('es-AR')}</div>
                        <div className={`detallepedido-celda${Number(item.stockDisponible) === 0 ? ' detallepedido-stock-cero' : ''}`}>{item.stockDisponible} u.</div>
                      </div>
                    ))}
                    <div className="detallepedido-total">
                      Total: ${Number(pedido.total).toLocaleString('es-AR')}
                    </div>
                  </div>

                  {pedido.latitud && pedido.longitud && (
                    <div className="detallepedido-pie-tarjeta">
                      <button type="button" className="panel-header-salir-btn" onClick={() => setModalMapa(true)}>
                        Ver ubicación
                      </button>
                    </div>
                  )}
                </div>

                <div className="detallepedido-acciones-panel">
                  <div className="detallepedido-acciones-titulo">Acciones — {ETIQUETA_ESTADO[pedido.estado] ?? pedido.estado}</div>

                  {pedido.estado === 'pendiente' && (
                    <div className="detallepedido-acciones-botones">
                      <button
                        className="pedidos-accion-btn pedidos-accion-btn--primario"
                        disabled={procesando}
                        onClick={handleAceptar}
                      >
                        {procesando ? 'Aceptando...' : 'Aceptar pedido'}
                      </button>
                      <button
                        className="pedidos-accion-btn pedidos-accion-btn--peligro"
                        onClick={abrirModalRechazo}
                      >
                        Rechazar pedido
                      </button>
                      {pedido.items.some(item => !item.propuestaSustitucion) && (
                        <button
                          className="pedidos-accion-btn"
                          onClick={() => navigate(`/pedidos/${id}/sustituir`)}
                        >
                          Proponer sustituto
                        </button>
                      )}
                    </div>
                  )}

                  {pedido.estado === 'aceptado' && (
                    <div className="detallepedido-acciones-botones">
                      <button
                        className="pedidos-accion-btn pedidos-accion-btn--primario"
                        disabled={procesando}
                        onClick={handleAvanzar}
                      >
                        {procesando ? 'Procesando...' : 'Marcar En camino'}
                      </button>
                    </div>
                  )}

                  {pedido.estado === 'en_camino' && (
                    <div className="detallepedido-acciones-botones">
                      <button
                        className="pedidos-accion-btn pedidos-accion-btn--primario"
                        disabled={procesando}
                        onClick={handleAvanzar}
                      >
                        {procesando ? 'Procesando...' : 'Marcar Entregado'}
                      </button>
                      <button
                        className="pedidos-accion-btn pedidos-accion-btn--peligro"
                        onClick={abrirModalRechazo}
                      >
                        Rechazar pedido
                      </button>
                    </div>
                  )}

                  {(pedido.estado === 'entregado' || pedido.estado === 'rechazado' || pedido.estado === 'cancelado') && (
                    <div className="detallepedido-sin-acciones">Este pedido no tiene acciones disponibles.</div>
                  )}

                  {errorAccion && <div className="pedidos-error-accion">{errorAccion}</div>}
                </div>

                {pedido.items
                  .filter(item => item.propuestaSustitucion)
                  .map(itemConPropuesta => {
                    const sustituto = itemConPropuesta.propuestaSustitucion.productoSustituto
                    return (
                      <div key={itemConPropuesta.propuestaSustitucion.id} className="detallepedido-tarjeta">
                        <div className="detallepedido-encabezado-tarjeta">
                          <div>
                            <div className="detallepedido-numero">Sustitución pedido #{pedido.id}</div>
                            <div className="detallepedido-subtitulo">Pendiente de que el comprador elija la cantidad y confirme.</div>
                          </div>
                          <EstadoBadge estado="pendiente" className="detallepedido-estado" />
                        </div>

                        <div className="detallepedido-tabla">
                          <div className="detallepedido-tabla-header detallepedido-tabla-header--sust">
                            <div>Producto original</div>
                            <div>Sustituto propuesto</div>
                            <div>Stock disp.</div>
                          </div>
                          <div className="detallepedido-tabla-fila detallepedido-tabla-fila--sust">
                            <div className="detallepedido-celda detallepedido-celda-producto">
                              {itemConPropuesta.imagenUrl
                                ? <img src={`http://localhost:3000${itemConPropuesta.imagenUrl}`} alt={itemConPropuesta.nombreProducto} className="detallepedido-thumb" />
                                : <span className="detallepedido-thumb detallepedido-thumb-sinimg">Sin imagen</span>
                              }
                              {itemConPropuesta.nombreProducto}
                            </div>
                            <div className="detallepedido-celda detallepedido-celda-producto">
                              {sustituto.imagenUrl
                                ? <img src={`http://localhost:3000${sustituto.imagenUrl}`} alt={sustituto.nombre} className="detallepedido-thumb" />
                                : <span className="detallepedido-thumb detallepedido-thumb-sinimg">Sin imagen</span>
                              }
                              {sustituto.nombre}
                            </div>
                            <div className={`detallepedido-celda${Number(sustituto.stockDisponible) === 0 ? ' detallepedido-stock-cero' : ''}`}>{sustituto.stockDisponible} u.</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </>
            )}

            </div>

      {modalMapa && pedido && (
        <ModalMapaDireccion
          soloLectura
          ubicacionInicial={{ lat: Number(pedido.latitud), lng: Number(pedido.longitud) }}
          direccionInicial={pedido.direccionEntrega}
          onCerrar={() => setModalMapa(false)}
        />
      )}

      {modalRechazo && (
        <div className="rechazo-overlay" onClick={cerrarModalRechazo}>
          <div className="rechazo-modal" onClick={e => e.stopPropagation()}>
            <div className="rechazo-titulo">Rechazar pedido #{id}</div>
            <div className="rechazo-subtitulo">
              {pedido?.estado === 'pendiente'
                ? 'Seleccioná el motivo del rechazo.'
                : 'Ingresá el motivo del rechazo ocurrido durante la entrega.'}
            </div>

            {pedido?.estado === 'pendiente' ? (
              <div className="rechazo-motivos">
                {MOTIVOS_RECHAZO_PENDIENTE.map(motivo => (
                  <label key={motivo} className="rechazo-motivo-opcion">
                    <input
                      type="radio"
                      name="motivoRechazo"
                      value={motivo}
                      checked={motivoRechazo === motivo}
                      onChange={e => setMotivoRechazo(e.target.value)}
                    />
                    {motivo}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="rechazo-textarea"
                rows={4}
                placeholder="Describí la situación ocurrida durante la entrega."
                value={motivoRechazo}
                onChange={e => setMotivoRechazo(e.target.value)}
              />
            )}

            {errorRechazo && <div className="rechazo-error">{errorRechazo}</div>}

            <div className="rechazo-acciones">
              <button
                className="pedidos-accion-btn pedidos-accion-btn--peligro rechazo-btn"
                disabled={rechazando}
                onClick={handleConfirmarRechazo}
              >
                {rechazando ? 'Confirmando...' : 'Confirmar rechazo'}
              </button>
              <button
                className="pedidos-accion-btn rechazo-btn"
                disabled={rechazando}
                onClick={cerrarModalRechazo}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelDistribuidor>
  )
}

export default DetallePedido
