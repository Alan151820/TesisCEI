import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import ModalMapaDireccion from '../../components/ModalMapaDireccion'
import EstadoBadge from '../../components/EstadoBadge'
import ToggleTema from '../../components/ToggleTema'
import { ETIQUETA_ESTADO } from '../../lib/pedido'
import './Inicio.css'
import './MisPedidos.css'
import './DetallePedido.css'

const NAV_ITEMS = [
  { label: 'Pedidos', ruta: '/pedidos' },
  { label: 'Productos', ruta: '/inicio' },
  { label: 'Proveedores', ruta: '/proveedores' },
  { label: 'Reparto', ruta: '/reparto' },
  { label: 'Reportes', ruta: '/reportes' },
  { label: 'Empleados', ruta: '/empleados' },
  { label: 'Editar perfil', ruta: '/editarPerfil' },
]

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
  const location = useLocation()
  const { id } = useParams()
  const nombre = localStorage.getItem('nombre') || ''
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  const [menuAbierto, setMenuAbierto] = useState(false)
  const [menuPerfil, setMenuPerfil] = useState(false)
  const perfilRef = useRef(null)

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
    if (!menuPerfil) return
    const cerrar = (e) => { if (!perfilRef.current?.contains(e.target)) setMenuPerfil(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [menuPerfil])

  useEffect(() => {
    api.get(`/api/pedidos/${id}/detalle`)
      .then(res => setPedido(res.data))
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }, [id])

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/login')
  }

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
    <div className="panel-root">

      {menuAbierto && (
        <div className="panel-drawer-overlay" onClick={() => setMenuAbierto(false)}>
          <nav className="panel-drawer" data-tema="oscuro" onClick={e => e.stopPropagation()}>
            <div className="panel-drawer-top">
              <div className="panel-drawer-marca">MarketDist</div>
              <button className="panel-drawer-cerrar-btn" onClick={() => setMenuAbierto(false)}>✕</button>
            </div>
            {NAV_ITEMS.map(item => (
              <div
                key={item.ruta}
                className={`panel-drawer-item${location.pathname === item.ruta ? ' activo' : ''}`}
                onClick={() => { navigate(item.ruta); setMenuAbierto(false) }}
              >
                {item.label}
              </div>
            ))}
            <div className="panel-drawer-sep" />
            <button className="panel-drawer-modo" onClick={() => { navigate('/inicioComprador'); setMenuAbierto(false) }}>
              ← Modo comprador
            </button>
            <div className="panel-drawer-footer">
              <div className="panel-drawer-nombre">{nombre}</div>
              <div className="panel-drawer-rol">Distribuidor</div>
              <button className="panel-drawer-logout" onClick={handleCerrarSesion}>Cerrar sesión</button>
            </div>
          </nav>
        </div>
      )}

      <div className="panel-mobile-header" data-tema="oscuro">
        <span className="panel-mobile-hamburger" onClick={() => setMenuAbierto(true)}>≡</span>
        <div className="panel-mobile-titulo">Pedido #{id}</div>
        <div style={{ width: 40 }} />
      </div>

      <header className="panel-master-header">
        <div className="panel-master-header-marca">MarketDist</div>
        <div className="panel-master-header-perfil">
          <button className="panel-header-salir-btn" onClick={() => navigate('/inicioComprador')}>
            Salir de distribuidora
          </button>
          <CampanaNotificaciones rutaDestino="/pedidos" />
          <div className="comprador-perfil-wrapper" ref={perfilRef}>
            <button className="comprador-perfil-trigger" onClick={() => setMenuPerfil(v => !v)}>
              <div className="comprador-avatar">{iniciales}</div>
              <span className="comprador-nombre">{nombre}</span>
              <span className="comprador-perfil-flecha">{menuPerfil ? '▴' : '▾'}</span>
            </button>
            {menuPerfil && (
              <div className="comprador-menu-desplegable">
                <ToggleTema />
                <div className="comprador-menu-item" onClick={handleCerrarSesion}>Cerrar sesión</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="panel-layout">

        <aside className="panel-sidebar" data-tema="oscuro">
          <div className="panel-sidebar-marca">
            <div className="panel-sidebar-titulo">MarketDist</div>
            <div className="panel-sidebar-subtitulo">Panel del Distribuidor</div>
          </div>

          <nav className="panel-nav">
            {NAV_ITEMS.map(item => (
              <div
                key={item.ruta}
                className={`panel-nav-item${item.ruta === '/pedidos' ? ' activo' : ''}`}
                onClick={() => navigate(item.ruta)}
              >
                {item.label}
              </div>
            ))}
          </nav>

          <div className="panel-sidebar-footer">
            <div className="panel-sidebar-usuario">
              <div className="panel-avatar-small">{iniciales}</div>
              <div>
                <div className="panel-sidebar-nombre">{nombre}</div>
                <div className="panel-sidebar-rol">Distribuidor</div>
              </div>
            </div>
            <div className="panel-sidebar-accion" onClick={handleCerrarSesion}>Cerrar sesión</div>
          </div>
        </aside>

        <main className="panel-main">
          <div className="panel-contenido">
            <div className="panel-contenido-centrado">

            <div className="detallepedido-migas">
              <span className="detallepedido-miga-link" onClick={() => navigate('/pedidos')}>Pedidos activos</span>
              <span className="detallepedido-miga-separador">›</span>
              <span className="detallepedido-miga-actual">Pedido #{id}</span>
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
                        📍 Ver ubicación
                      </button>
                    </div>
                  )}
                </div>

                <div className="detallepedido-acciones-panel">
                  <div className="detallepedido-acciones-titulo">Acciones — {ETIQUETA_ESTADO[pedido.estado] ?? pedido.estado}</div>

                  {pedido.estado === 'pendiente' && (
                    <>
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
                    </>
                  )}

                  {pedido.estado === 'aceptado' && (
                    <button
                      className="pedidos-accion-btn pedidos-accion-btn--primario"
                      disabled={procesando}
                      onClick={handleAvanzar}
                    >
                      {procesando ? 'Procesando...' : 'Marcar En camino'}
                    </button>
                  )}

                  {pedido.estado === 'en_camino' && (
                    <>
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
                    </>
                  )}

                  {(pedido.estado === 'entregado' || pedido.estado === 'rechazado') && (
                    <div className="detallepedido-sin-acciones">Este pedido no tiene acciones disponibles.</div>
                  )}

                  {errorAccion && <div className="pedidos-error-accion">{errorAccion}</div>}
                </div>
              </>
            )}

            </div>
          </div>
        </main>
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
    </div>
  )
}

export default DetallePedido
