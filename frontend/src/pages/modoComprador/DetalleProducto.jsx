import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import './DetalleProducto.css'

function DetalleProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const nombre = localStorage.getItem('nombre') || ''
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const { agregarProducto, totalItems } = useCarrito()
  const [producto, setProducto] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState(null)
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    api.get(`/api/catalogo/${id}`)
      .then(res => {
        setProducto(res.data)
        if (res.data.tarifas.length > 0) {
          setTarifaSeleccionada(res.data.tarifas[0])
          setCantidad(Number(res.data.tarifas[0].cantidadMinima))
        }
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
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/catalogo', { replace: true })
  }

  const agregarAlCarrito = () => {
    if (!tarifaSeleccionada) return
    agregarProducto({
      ...producto,
      tarifaSeleccionada,
      precioVolumenId: tarifaSeleccionada.id,
      cantidad
    })
  }

  if (mensaje) return <p className="detalleproducto-mensaje-pagina">{mensaje}</p>
  if (!producto) return <p className="detalleproducto-mensaje-pagina">Cargando...</p>

  return (
    <div className="detalleproducto-layout">

      <header className={token ? 'detalleproducto-header-autenticado' : 'detalleproducto-header'}>
        <div className="detalleproducto-header-marca" onClick={() => navigate(token ? '/inicioComprador' : '/catalogo')}>MarketPlace</div>
        <div className="detalleproducto-header-buscador">
          <span className="detalleproducto-header-buscador-icono">⌕</span>
          <span className="detalleproducto-header-buscador-texto">Buscar productos…</span>
        </div>
        <div className={token ? 'detalleproducto-acciones-auth' : 'detalleproducto-header-acciones'}>
          {token ? (
            <>
              <button className="detalleproducto-btn-carrito" onClick={() => navigate('/carrito')}>
                🛒{totalItems > 0 && <span className="detalleproducto-carrito-badge">{totalItems}</span>}
              </button>
              <button className="detalleproducto-btn-distribuidora" onClick={() => navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil')}>
                Distribuidora
              </button>
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
              <button className="detalleproducto-btn-carrito" onClick={() => navigate('/carrito')}>
                🛒{totalItems > 0 && <span className="detalleproducto-carrito-badge">{totalItems}</span>}
              </button>
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

            <h1 className="detalleproducto-nombre">{producto.nombre}</h1>
            <p className="detalleproducto-descripcion">{producto.descripcion}</p>

            <h2 className="detalleproducto-tarifas-titulo">Precios por volumen</h2>
            {producto.tarifas.length === 0 ? (
              <p className="detalleproducto-tarifas-vacio">Este producto no tiene tarifas disponibles actualmente.</p>
            ) : (
              <table className="detalleproducto-tarifas-tabla">
                <thead>
                  <tr>
                    <th>Cantidad mínima</th>
                    <th>Precio unitario</th>
                    <th>Disponibilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {producto.tarifas.map((t, i) => (
                    <tr
                      key={i}
                      className={tarifaSeleccionada === t ? 'detalleproducto-tarifa-seleccionada' : ''}
                      onClick={() => { setTarifaSeleccionada(t); setCantidad(Number(t.cantidadMinima)) }}
                    >
                      <td>{t.cantidadMinima}</td>
                      <td>${Number(t.precioVenta).toLocaleString('es-AR')}</td>
                      <td>{producto.stockDisponible > 0 ? 'Con stock' : 'Sin stock'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="detalleproducto-carrito-caja">
              <div className="detalleproducto-carrito-titulo">Agregar al carrito</div>
              {tarifaSeleccionada && (
                <div className="detalleproducto-carrito-cantidad-fila">
                  <input
                    type="number"
                    className="detalleproducto-carrito-cantidad-caja"
                    value={cantidad}
                    min={Number(tarifaSeleccionada.cantidadMinima)}
                    onChange={e => setCantidad(Number(e.target.value))}
                  />
                  <div className="detalleproducto-carrito-cantidad-info">
                    unidades · <strong>${Number(tarifaSeleccionada.precioVenta).toLocaleString('es-AR')} c/u</strong>
                  </div>
                </div>
              )}
              {token ? (
                <button
                  className="detalleproducto-carrito-boton"
                  onClick={agregarAlCarrito}
                  disabled={producto.stockDisponible === 0}
                >
                  {producto.stockDisponible === 0 ? 'Sin stock' : 'Agregar al carrito'}
                </button>
              ) : (
                <>
                  <button className="detalleproducto-carrito-boton" onClick={() => navigate('/login')}>
                    Iniciá sesión para comprar
                  </button>
                  <div className="detalleproducto-carrito-nota">
                    O <span onClick={() => navigate('/registro')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>registrate gratis</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default DetalleProducto