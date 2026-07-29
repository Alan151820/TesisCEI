import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { tokenValido, rutaInicio } from '../../lib/auth'
import './Carrito.css'

function Carrito() {
  const navigate = useNavigate()
  const { items, modificarCantidad, eliminarProducto, vaciar, totalItems } = useCarrito()

  const porDistribuidor = items.reduce((acc, item) => {
    const key = item.distribuidorId
    if (!acc[key]) acc[key] = { nombreDistribuidor: item.nombreDistribuidor, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  const subtotalTotal = items.reduce((acc, i) => acc + Number(i.precioMinimo) * i.cantidad, 0)

  return (
    <div className="carrito-pagina">

      <div className="carrito-mobile-header">
        <span className="carrito-mobile-volver" onClick={() => navigate(-1)}>←</span>
        <div className="carrito-mobile-titulo">Mi carrito</div>
      </div>

      <header className="carrito-topbar">
        <div className="carrito-topbar-marca" onClick={() => navigate(rutaInicio())}>MarketDist</div>
        <div className="carrito-topbar-titulo">Mi carrito</div>
        <div className="carrito-topbar-acciones">
          <span className="carrito-topbar-link" onClick={() => navigate(rutaInicio())}>← Seguir comprando</span>
        </div>
      </header>

      <div className="carrito-contenido">

        {items.length === 0 ? (
          <div className="carrito-vacio">
            <div className="carrito-vacio-icono">🛒</div>
            <div className="carrito-vacio-titulo">Tu carrito está vacío</div>
            <div className="carrito-vacio-subtitulo">Explorá el catálogo y agregá productos.</div>
            <button className="carrito-vacio-btn" onClick={() => navigate(rutaInicio())}>Ver catálogo</button>
          </div>
        ) : (
          <div className="carrito-layout">
            <div className="carrito-lista">
              {Object.entries(porDistribuidor).map(([distId, grupo]) => (
                <div key={distId} className="carrito-grupo">
                  <div className="carrito-grupo-header">{grupo.nombreDistribuidor}</div>
                  {grupo.items.map(item => (
                    <div key={item.id} className="carrito-item">
                      <div className="carrito-item-foto">
                        {item.imagenUrl
                          ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombre} className="carrito-item-img" />
                          : <div className="carrito-item-img-placeholder">—</div>
                        }
                      </div>
                      <div className="carrito-item-info">
                        <div className="carrito-item-nombre">{item.nombre}</div>
                        <div className="carrito-item-precio">
                          Precio est. ${Number(item.precioMinimo).toLocaleString('es-AR')} c/u
                        </div>
                      </div>
                      <div className="carrito-item-controles">
                        <button
                          className="carrito-item-btn"
                          onClick={() => modificarCantidad(item.id, item.cantidad - 1)}
                        >−</button>
                        <span className="carrito-item-cantidad">{item.cantidad}</span>
                        <button
                          className="carrito-item-btn"
                          onClick={() => modificarCantidad(item.id, item.cantidad + 1)}
                        >+</button>
                      </div>
                      <button
                        className="carrito-item-eliminar"
                        onClick={() => eliminarProducto(item.id)}
                      >✕</button>
                    </div>
                  ))}
                </div>
              ))}

              <button className="carrito-vaciar-btn" onClick={vaciar}>Vaciar carrito</button>
            </div>

            <div className="carrito-resumen">
              <div className="carrito-resumen-titulo">Resumen</div>
              <div className="carrito-resumen-fila">
                <span>Productos ({totalItems})</span>
                <span>${subtotalTotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="carrito-resumen-nota">
                * Los precios son estimados según el precio mínimo publicado. El total final depende del volumen y condiciones del distribuidor.
              </div>
              <button
                className="carrito-resumen-btn"
                onClick={() => {
                  if (!localStorage.getItem('token')) {
                    navigate('/login')
                  } else {
                    navigate('/confirmar-pedido')
                  }
                }}
              >
                Confirmar pedido
              </button>
            </div>
          </div>
        )}

      </div>

      <nav className="carrito-bottom-nav">
        <div className="carrito-bottom-item" onClick={() => navigate(rutaInicio())}>
          <span className="carrito-bottom-icono">◻</span>
          <span className="carrito-bottom-label">Catálogo</span>
        </div>
        <div className="carrito-bottom-item activo">
          <span className="carrito-bottom-icono">🛒</span>
          <span className="carrito-bottom-label">Carrito</span>
        </div>
      </nav>

    </div>
  )
}

export default Carrito
