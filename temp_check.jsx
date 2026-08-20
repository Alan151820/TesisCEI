import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { useCarrito } from '../../context/CarritoContext'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNavComprador from '../../components/BottomNavComprador'
import { construirTituloProducto } from '../../lib/producto'
import './DetalleProducto.css'

function DetalleProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const nombre = localStorage.getItem('nombre') || ''
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const [producto, setProducto] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const { agregarProducto, totalItems } = useCarrito()

  useEffect(() => {
    api.get(`/api/catalogo/${id}`)
      .then(res => {
        setProducto(res.data)
        setCantidad(1)
      })
      .catch(err => {
        setMensaje(err.response?.data?.mensaje || 'No fue posible completar la operación. Intente nuevamente más tarde.')
      })
  }, [id])

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('telefono')
    localStorage.removeItem('modoDistribuidorActivo')
    navigate('/catalogo', { replace: true })
  }

  const decrementar = () => {
    setCantidad(prev => Math.max(1, (Number(prev) || 1) - 1))
  }

  const incrementar = () => {
    setCantidad(prev => (Number(prev) || 1) + 1)
  }

  const handleCantidadChange = (e) => {
    const valor = e.target.value
    if (valor === '') {
      setCantidad('')
      return
    }
    const num = parseInt(valor, 10)
    if (!isNaN(num)) setCantidad(Math.max(1, num))
  }

  const handleCantidadBlur = () => {
    if (cantidad === '' || Number(cantidad) < 1) setCantidad(1)
  }

  if (mensaje) return <p className="detalleproducto-mensaje-pagina">{mensaje}</p>
  if (!producto) return <p className="detalleproducto-mensaje-pagina">Cargando...</p>

  const titulo = construirTituloProducto(producto)
  const preciosVol = (producto.tarifas || []).map(t => Number(t.precioVenta))
  const precioBase = producto.tarifas?.[0] ? Number(producto.tarifas[0].precioVenta) : null
  const precioMinimo = preciosVol.length ? Math.min(...preciosVol) : null

  return (
    <div className="detalleproducto-layout">

      <header className={token ? 'detalleproducto-header-autenticado' : 'detalleproducto-header'}>
        <div className="detalleproducto-header-marca" onClick={() => navigate('/')}>MarketDist</div>
        <div className="detalleproducto-header-buscador">
          <span className="detalleproducto-header-buscador-icono">⌕</span>
          <span className="detalleproducto-header-buscador-texto">Buscar productos…</span>
        </div>
        <div className={token ? 'detalleproducto-acciones-auth' : 'detalleproducto-header-acciones'}>
          <button className="detalleproducto-btn-carrito" onClick={() => navigate('/carrito')}>
            🛒{totalItems > 0 && <span className="detalleproducto-carrito-badge">{totalItems}</span>}
          </button>
          {token ? (
            <>
              <span className="detalleproducto-nav-link" onClick={() => navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil')}>
                Distribuidora
              </span>
              <CampanaNotificaciones rutaDestino="/misPedidos" rutaDetalle="/pedido" />
              <div className="detalleproducto-perfil">
                <div className="detalleproducto-avatar">{iniciales}</div>
                <span className="detalleproducto-nombre-usuario">{nombre}</span>
              </div>
              <button className="detalleproducto-btn-cerrar-sesion" onClick={cerrarSesion}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button className="detalleproducto-btn-login" onClick={() => navigate('/login')}>Iniciar sesión</button>
              <button className="detalleproducto-btn-registro" onClick={() => navigate('/registro')}>Registrarse</button>
            </>
          )}
        </div>
      </header>

      <div className="detalleproducto-contenido">
        <button className="detalleproducto-volver" onClick={() => navigate(-1)}>← Volver</button>

        <div className="detalleproducto-breadcrumb">
          Catálogo / {producto.categoria} / <span>{producto.nombre}</span>
        </div>

        <div className="detalleproducto-tarjeta">
          {producto.imagenUrl
            ? <img src={`http://localhost:3000${producto.imagenUrl}`} alt={producto.nombre} className="detalleproducto-imagen" />
            : <div className="detalleproducto-imagen-placeholder">[foto de producto]</div>
          }

          <div className="detalleproducto-info">
            <div className="detalleproducto-info-categoria">
              {producto.categoria} ·{' '}
              <button
                className="detalleproducto-info-distribuidor"
                onClick={() => navigate(`/perfilDistribuidor/${producto.distribuidorId}`, { replace: true })}
              >
                {producto.nombreDistribuidor}
              </button>
            </div>

            <h1 className="detalleproducto-nombre">{titulo}</h1>
            <p className="detalleproducto-descripcion">{producto.descripcion}</p>

            {producto.tarifas.length > 0 && (
              <div className="detalleproducto-rango">
                <span className="detalleproducto-rango-desde">Desde ${precioMinimo.toLocaleString('es-AR')}</span>
                {precioBase != null && precioBase !== precioMinimo && (
                  <span className="detalleproducto-rango-hasta">hasta ${precioBase.toLocaleString('es-AR')}</span>
                )}
              </div>
            )}
            {producto.stockDisponible <= 0 && (
              <div className="detalleproducto-sin-stock">Sin stock disponible</div>
            )}

            <h2 className="detalleproducto-tarifas-titulo">Precios por volumen</h2>
            {producto.tarifas.length === 0 ? (
              <p className="detalleproducto-tarifas-vacio">Este producto no tiene tarifas disponibles actualmente.</p>
            ) : (
              <table className="detalleproducto-tarifas-tabla">
                <thead>
                  <tr>
                    <th>Cantidad mínima</th>
                    <th>Precio unitario</th>
                  </tr>
                </thead>
                <tbody>
                  {producto.tarifas.map((t, i) => (
                    <tr key={i}>
                      <td>{t.cantidadMinima} u.</td>
                      <td>${Number(t.precioVenta).toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="detalleproducto-carrito-caja">
              <div className="detalleproducto-carrito-titulo">Agregar al carrito</div>
              {producto.tarifas.length > 0 && (
                <div className="detalleproducto-carrito-cantidad-fila">
                  <div className="detalleproducto-carrito-stepper">
                    <button className="detalleproducto-stepper-btn" onClick={decrementar}>−</button>
                    <input
                      type="number"
                      className="detalleproducto-stepper-valor"
                      min="1"
                      value={cantidad}
                      onChange={handleCantidadChange}
                      onBlur={handleCantidadBlur}
                    />
                    <button className="detalleproducto-stepper-btn" onClick={incrementar}>+</button>
                  </div>
                  <div className="detalleproducto-carrito-cantidad-info">
                    unidades · <strong>${Number(producto.tarifas[0].precioVenta).toLocaleString('es-AR')} c/u</strong>
                  </div>
                </div>
              )}
              {token ? (
                <button
                  className="detalleproducto-carrito-boton"
                  onClick={() => agregarProducto({ ...producto, precioMinimo }, Number(cantidad) || 1)}
                >
                  Agregar al carrito
                </button>
              ) : (
                <>
                  <button className="detalleproducto-carrito-boton" disabled>Agregar al carrito</button>
                  <div className="detalleproducto-carrito-nota">Iniciá sesión para comprar</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {token && <BottomNavComprador />}

    </div>
  )
}

export default DetalleProducto
