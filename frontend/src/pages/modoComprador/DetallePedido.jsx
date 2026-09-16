import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate, useParams } from 'react-router-dom'
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
import Miga from '../../components/ui/Miga'
import Modal from '../../components/ui/Modal'
import ModalHeader from '../../components/ui/ModalHeader'
import ModalBody from '../../components/ui/ModalBody'
import ModalFooter from '../../components/ui/ModalFooter'
import './InicioComprador.css'
import './DetallePedido.css'
import Marca from '../../components/Marca'

const COLUMNAS = ['Producto', 'Cantidad', 'Precio unit.', 'Subtotal']
const GRID = '1fr 120px 140px 140px'

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
  const [modalCancelar, setModalCancelar] = useState(false)

  useEffect(() => {
    api.get(`/api/pedidos/${id}`)
      .then(res => setPedido(res.data))
      .catch(err => setError(mensajeDeError(err)))
      .finally(() => setCargando(false))
  }, [id])

  const handleCancelar = async () => {
    setErrorCancelar('')
    setCancelando(true)
    try {
      await api.patch(`/api/pedidos/${id}/cancelar`)
      const res = await api.get(`/api/pedidos/${id}`)
      setPedido(res.data)
      setModalCancelar(false)
    } catch (err) {
      setErrorCancelar(mensajeDeError(err))
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="detallepedido-pagina">

      <Hdr logo={<span className="hdr-logo" onClick={() => navigate(rutaInicio())}><Marca /></span>} buscador>
        <span className="link comprador-nav-link" onClick={() => navigate('/misPedidos')}>Mis pedidos</span>
        <span className="link comprador-nav-link" onClick={() => navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil')}>Distribuidora</span>
        <CampanaNotificaciones rutaDestino="/misPedidos" rutaDetalle="/pedido" />
        <Boton variante="icono" className="hdr-btn-carrito" badge={totalItems} onClick={() => navigate('/carrito')} aria-label="Carrito">🛒</Boton>
        <MenuPerfilComprador />
      </Hdr>

      <main className="detallepedido-main">

        <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
          <Miga items={[{ etiqueta: 'Mis pedidos', to: '/misPedidos' }, { etiqueta: `Pedido #${id}` }]} />
          <Boton variante="outline" onClick={() => navigate('/misPedidos')}>Volver</Boton>
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

            <Tabla className="detallepedido-tabla" grid={GRID}>
              <TablaHeader columnas={COLUMNAS} className="detallepedido-tabla-header" />
              {pedido.items.map((item, i) => (
                <TablaFila key={i} className="detallepedido-tabla-fila">
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
                </TablaFila>
              ))}
            </Tabla>
            <div className="fila" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
              <span className="texto" style={{ fontWeight: 700 }}>Total: ${Number(pedido.total).toLocaleString('es-AR')}</span>
            </div>

            {(pedido.estado === 'pendiente' || pedido.estado === 'aceptado') && (
              <>
                <Boton variante="peligro" onClick={() => setModalCancelar(true)}>
                  Cancelar pedido
                </Boton>

                {errorCancelar && <div className="pedidos-error-accion">{errorCancelar}</div>}
              </>
            )}
          </div>
        )}

      </main>

      {modalCancelar && (
        <Modal onCerrar={() => setModalCancelar(false)}>
          <ModalHeader titulo="Cancelar pedido" onCerrar={() => setModalCancelar(false)} />
          <ModalBody>
            <p className="texto-mudo" style={{ margin: 0 }}>
              ¿Cancelar este pedido? Esta acción no se puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Boton variante="outline" onClick={() => setModalCancelar(false)}>Volver</Boton>
            <Boton variante="peligro" disabled={cancelando} onClick={handleCancelar}>
              {cancelando ? 'Cancelando...' : 'Cancelar pedido'}
            </Boton>
          </ModalFooter>
        </Modal>
      )}

      <BottomNav />

    </div>
  )
}

export default DetallePedido
