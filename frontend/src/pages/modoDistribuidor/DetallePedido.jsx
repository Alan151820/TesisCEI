import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/axios'
import ModalMapaDireccion from '../../components/ModalMapaDireccion'
import EstadoBadge from '../../components/EstadoBadge'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import Tabla from '../../components/ui/Tabla'
import TablaHeader from '../../components/ui/TablaHeader'
import TablaFila from '../../components/ui/TablaFila'
import Miga from '../../components/ui/Miga'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Modal from '../../components/ui/Modal'
import ModalHeader from '../../components/ui/ModalHeader'
import ModalBody from '../../components/ui/ModalBody'
import ModalFooter from '../../components/ui/ModalFooter'
import { ETIQUETA_ESTADO } from '../../lib/pedido'
import './Inicio.css'
import './MisPedidos.css'
import './DetallePedido.css'

const COLUMNAS = ['Producto', 'Cantidad', 'Precio unit.', 'Subtotal', 'Stock disp.']
const GRID = '1fr 100px 120px 120px 110px'

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
  const [whatsappLink, setWhatsappLink] = useState(null)
  const [modalRechazo, setModalRechazo] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [errorRechazo, setErrorRechazo] = useState(null)
  const [rechazando, setRechazando] = useState(false)
  const [modalMapa, setModalMapa] = useState(false)

  useEffect(() => {
    api.get(`/api/pedidos/${id}/detalle`)
      .then(res => setPedido(res.data))
      .catch(err => setError(mensajeDeError(err)))
      .finally(() => setCargando(false))
  }, [id])

  const handleAceptar = async () => {
    const ventanaWhatsapp = window.open('', '_blank')
    setProcesando(true)
    setErrorAccion(null)
    try {
      const res = await api.patch(`/api/pedidos/${id}/aceptar`)
      setPedido(prev => ({ ...prev, estado: 'aceptado' }))
      setWhatsappLink(res.data.deepLink)
      if (ventanaWhatsapp) ventanaWhatsapp.location.href = res.data.deepLink
    } catch (err) {
      if (ventanaWhatsapp) ventanaWhatsapp.close()
      setErrorAccion(mensajeDeError(err))
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
      setErrorAccion(mensajeDeError(err))
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
      setErrorRechazo(mensajeDeError(err))
    } finally {
      setRechazando(false)
    }
  }

  return (
    <PanelDistribuidor activo="/pedidos">
            <div className="panel-contenido-centrado">

            <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
              <Miga items={[{ etiqueta: 'Pedidos activos', to: '/pedidos' }, { etiqueta: `Pedido #${id}` }]} />
              <Boton variante="outline" onClick={() => navigate('/pedidos')}>Volver</Boton>
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

                  <Tabla className="detallepedido-tabla" grid={GRID}>
                    <TablaHeader columnas={COLUMNAS} className="detallepedido-tabla-header" />
                    {pedido.items.map((item, i) => (
                      <TablaFila key={i} className="detallepedido-tabla-fila">
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
                      </TablaFila>
                    ))}
                  </Tabla>
                  <div className="fila" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                    <span className="texto" style={{ fontWeight: 700 }}>Total: ${Number(pedido.total).toLocaleString('es-AR')}</span>
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
                      {whatsappLink && (
                        <a
                          className="pedidos-accion-btn"
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Abrir WhatsApp con el comprador
                        </a>
                      )}
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
        <Modal onCerrar={cerrarModalRechazo}>
          <ModalHeader titulo={`Rechazar pedido #${id}`} onCerrar={cerrarModalRechazo} />
          <ModalBody>
            <p className="texto-mudo" style={{ margin: 0 }}>
              {pedido?.estado === 'pendiente'
                ? 'Seleccioná el motivo del rechazo.'
                : 'Ingresá el motivo del rechazo ocurrido durante la entrega.'}
            </p>

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
              <Campo
                area
                rows={4}
                placeholder="Describí la situación ocurrida durante la entrega."
                value={motivoRechazo}
                onChange={e => setMotivoRechazo(e.target.value)}
              />
            )}

            {errorRechazo && <div className="rechazo-error">{errorRechazo}</div>}
          </ModalBody>
          <ModalFooter>
            <Boton variante="outline" disabled={rechazando} onClick={cerrarModalRechazo}>Cancelar</Boton>
            <Boton variante="peligro" disabled={rechazando} onClick={handleConfirmarRechazo}>
              {rechazando ? 'Confirmando...' : 'Confirmar rechazo'}
            </Boton>
          </ModalFooter>
        </Modal>
      )}
    </PanelDistribuidor>
  )
}

export default DetallePedido
