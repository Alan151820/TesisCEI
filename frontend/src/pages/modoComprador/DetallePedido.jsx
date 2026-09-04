import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido, rutaInicio } from '../../lib/auth'
import { useCarrito } from '../../context/CarritoContext'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNavComprador from '../../components/BottomNavComprador'
import EstadoBadge from '../../components/EstadoBadge'
import ToggleTema from '../../components/ToggleTema'
import { resolverTramoPrecio } from '../../lib/producto'
import './InicioComprador.css'
import './DetallePedido.css'

function formatearFecha(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DetallePedido() {
  const navigate = useNavigate()
  const { id } = useParams()
  const nombre = localStorage.getItem('nombre') || ''
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const { totalItems } = useCarrito()
  const [menuPerfil, setMenuPerfil] = useState(false)
  const perfilRef = useRef(null)

  useEffect(() => {
    if (!tokenValido()) navigate('/login')
  }, [navigate])

  useEffect(() => {
    if (!menuPerfil) return
    const cerrar = (e) => { if (!perfilRef.current?.contains(e.target)) setMenuPerfil(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [menuPerfil])

  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [respondiendoId, setRespondiendoId] = useState(null)
  const [errorSustitucion, setErrorSustitucion] = useState('')
  const [cantidadesSustitucion, setCantidadesSustitucion] = useState({})

  const [cancelando, setCancelando] = useState(false)
  const [errorCancelar, setErrorCancelar] = useState('')

  useEffect(() => {
    api.get(`/api/pedidos/${id}`)
      .then(res => setPedido(res.data))
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }, [id])

  // RF-026: aceptar o rechazar una propuesta de sustitución del distribuidor.
  // Al aceptar, la cantidad la elige el comprador acá mismo.
  const handleResponderSustitucion = async (propuestaId, respuesta, cantidad) => {
    setErrorSustitucion('')
    setRespondiendoId(propuestaId)
    try {
      await api.patch(`/api/pedidos/sustituciones/${propuestaId}/${respuesta}`, respuesta === 'aceptar' ? { cantidad } : undefined)
      const res = await api.get(`/api/pedidos/${id}`)
      setPedido(res.data)
    } catch (err) {
      setErrorSustitucion(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setRespondiendoId(null)
    }
  }

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
      setErrorCancelar(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCancelando(false)
    }
  }

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('telefono')
    localStorage.removeItem('modoDistribuidorActivo')
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/catalogo')
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
          <div className="comprador-perfil-wrapper" ref={perfilRef}>
            <button className="comprador-perfil-trigger" onClick={() => setMenuPerfil(v => !v)}>
              <div className="comprador-avatar">{iniciales}</div>
              <span className="comprador-nombre">{nombre}</span>
              <span className="comprador-perfil-flecha">{menuPerfil ? '▴' : '▾'}</span>
            </button>
            {menuPerfil && (
              <div className="comprador-menu-desplegable">
                <div className="comprador-menu-item comprador-menu-item--mobile" onClick={() => { setMenuPerfil(false); navigate('/misPedidos') }}>Mis pedidos</div>
                <div className="comprador-menu-item comprador-menu-item--mobile" onClick={() => { setMenuPerfil(false); navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil') }}>Distribuidora</div>
                <ToggleTema />
                <div className="comprador-menu-item" onClick={handleCerrarSesion}>Cerrar sesión</div>
              </div>
            )}
          </div>
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

        {!cargando && !error && pedido && pedido.items
          .filter(item => item.propuestaSustitucion)
          .map(itemConPropuesta => {
            const propuesta = itemConPropuesta.propuestaSustitucion
            const cantidadTexto = cantidadesSustitucion[propuesta.id] ?? ''
            const cantidadNum = Number(cantidadTexto)
            const cantidadValida = cantidadTexto !== '' && Number.isInteger(cantidadNum) && cantidadNum > 0
            const tramo = cantidadValida ? resolverTramoPrecio(propuesta.productoSustituto.preciosVolumen, cantidadNum) : null

            return (
              <div key={propuesta.id} className="detallepedido-tarjeta sustitucion-tarjeta">
                <div className="detallepedido-encabezado-tarjeta">
                  <div>
                    <div className="detallepedido-numero">Sustitución pedido #{pedido.id}</div>
                    <div className="detallepedido-subtitulo">El distribuidor propuso un sustituto. Elegí la cantidad para ver el precio.</div>
                  </div>
                  <EstadoBadge estado="pendiente" className="detallepedido-estado" />
                </div>

                <div className="detallepedido-tabla">
                  <div className="detallepedido-tabla-header">
                    <div>Producto</div>
                    <div>Cantidad</div>
                    <div>Precio unit.</div>
                    <div>Subtotal</div>
                  </div>
                  {pedido.items.map((item, i) => {
                    const esElSustituido = item.pedidoItemId === itemConPropuesta.pedidoItemId
                    const productoMostrado = esElSustituido ? propuesta.productoSustituto : { id: item.productoId, nombre: item.nombreProducto, imagenUrl: item.imagenUrl }
                    return (
                      <div key={i} className="detallepedido-tabla-fila">
                        <div className="detallepedido-celda detallepedido-celda-producto">
                          {productoMostrado.imagenUrl
                            ? <img src={`http://localhost:3000${productoMostrado.imagenUrl}`} alt={productoMostrado.nombre} className="detallepedido-thumb" />
                            : <span className="detallepedido-thumb detallepedido-thumb-sinimg">Sin imagen</span>
                          }
                          <button
                            type="button"
                            className="detallepedido-producto-boton"
                            onClick={() => navigate(`/producto/${productoMostrado.id}`)}
                          >
                            {productoMostrado.nombre}
                          </button>
                        </div>
                        {esElSustituido ? (
                          <div className="detallepedido-celda">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              className="sustitucion-input-cantidad"
                              placeholder="Cantidad"
                              value={cantidadTexto}
                              onChange={e => setCantidadesSustitucion(prev => ({ ...prev, [propuesta.id]: e.target.value }))}
                            />
                          </div>
                        ) : (
                          <div className="detallepedido-celda">{Number(item.cantidad)} u.</div>
                        )}
                        <div className="detallepedido-celda">
                          {esElSustituido
                            ? (tramo ? `$${Number(tramo.precioVenta).toLocaleString('es-AR')}` : '—')
                            : `$${Number(item.precioVentaCongelado).toLocaleString('es-AR')}`}
                        </div>
                        <div className="detallepedido-celda">
                          {esElSustituido
                            ? (tramo ? `$${(cantidadNum * Number(tramo.precioVenta)).toLocaleString('es-AR')}` : '—')
                            : `$${(Number(item.cantidad) * Number(item.precioVentaCongelado)).toLocaleString('es-AR')}`}
                        </div>
                      </div>
                    )
                  })}

                  {propuesta.productoSustituto.preciosVolumen?.length > 0 && (
                    <div className="sustitucion-precios-wrapper">
                      <div className="sustitucion-precios-titulo">Precios por volumen</div>
                      <table className="sustitucion-precios-tabla">
                        <thead>
                          <tr>
                            <th>Cantidad mínima</th>
                            <th>Precio unitario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {propuesta.productoSustituto.preciosVolumen.map((pv, i) => (
                            <tr key={i}>
                              <td>{pv.cantidadMinima} u.</td>
                              <td>${Number(pv.precioVenta).toLocaleString('es-AR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="detallepedido-total">
                    {tramo
                      ? `Total: $${pedido.items.reduce((acc, item) => {
                          const esElSustituido = item.pedidoItemId === itemConPropuesta.pedidoItemId
                          const cantidad = esElSustituido ? cantidadNum : item.cantidad
                          const precioUnitario = esElSustituido ? tramo.precioVenta : item.precioVentaCongelado
                          return acc + Number(cantidad) * Number(precioUnitario)
                        }, 0).toLocaleString('es-AR')}`
                      : 'Ingresá una cantidad válida para ver el total.'}
                  </div>
                </div>

                <div className="sustitucion-acciones">
                  <button
                    className="sustitucion-btn sustitucion-btn--primario"
                    disabled={respondiendoId === propuesta.id || !tramo}
                    onClick={() => handleResponderSustitucion(propuesta.id, 'aceptar', cantidadNum)}
                  >
                    {respondiendoId === propuesta.id ? 'Procesando...' : 'Aceptar sustitución'}
                  </button>
                  <button
                    className="sustitucion-btn sustitucion-btn--secundario"
                    disabled={respondiendoId === propuesta.id}
                    onClick={() => handleResponderSustitucion(propuesta.id, 'rechazar')}
                  >
                    Rechazar sustitución
                  </button>
                </div>

                {errorSustitucion && <div className="sustitucion-error">{errorSustitucion}</div>}
              </div>
            )
          })}

      </main>

      <BottomNavComprador />

    </div>
  )
}

export default DetallePedido
