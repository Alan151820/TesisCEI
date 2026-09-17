import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { rutaInicio } from '../../lib/auth'
import { precioAplicable } from '../../lib/precios'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNav from '../../components/BottomNav'
import MenuPerfilComprador from '../../components/MenuPerfilComprador'
import Hdr from '../../components/Hdr'
import Boton from '../../components/ui/Boton'
import Tarjeta from '../../components/ui/Tarjeta'
import EstadoLista from '../../components/ui/EstadoLista'
import './InicioComprador.css'
import './Carrito.css'
import Marca from '../../components/Marca'

function Carrito() {
  const navigate = useNavigate()
  const { items, modificarCantidad, eliminarProducto, vaciar, totalItems } = useCarrito()
  const token = localStorage.getItem('token')
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'

  const porDistribuidor = items.reduce((acc, item) => {
    const key = item.distribuidorId
    if (!acc[key]) acc[key] = { nombreDistribuidor: item.nombreDistribuidor, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  const subtotalTotal = items.reduce((acc, i) => acc + (precioAplicable(i.tarifas, i.cantidad) || 0) * i.cantidad, 0)

  return (
    <div className="carrito-pagina">

      <Hdr logo={<span className="hdr-logo" onClick={() => navigate(rutaInicio())}><Marca /></span>} buscador>
        {token ? (
          <>
            <span className="link comprador-nav-link" onClick={() => navigate('/misPedidos')}>Mis pedidos</span>
            <span className="link comprador-nav-link" onClick={() => navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil')}>Distribuidora</span>
            <CampanaNotificaciones rutaDestino="/misPedidos" rutaDetalle="/pedido" />
            <Boton variante="icono" className="hdr-btn-carrito" badge={totalItems} onClick={() => navigate('/carrito')} aria-label="Carrito">🛒</Boton>
            <MenuPerfilComprador />
          </>
        ) : (
          <>
            <Boton variante="icono" className="hdr-btn-carrito" badge={totalItems} onClick={() => navigate('/carrito')} aria-label="Carrito">🛒</Boton>
            <Boton variante="ghost" onClick={() => navigate('/login')}>Iniciar sesión</Boton>
            <Boton variante="fill" onClick={() => navigate('/registro')}>Registrarse</Boton>
          </>
        )}
      </Hdr>

      <div className="carrito-contenido">

        {items.length === 0 ? (
          <EstadoLista className="col gap-m" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 36 }}>🛒</span>
            <span className="texto" style={{ fontWeight: 700 }}>Tu carrito está vacío</span>
            <span>Explorá el catálogo y agregá productos.</span>
            <Boton onClick={() => navigate(rutaInicio())}>Ver catálogo</Boton>
          </EstadoLista>
        ) : (
          <div className="carrito-layout">
            <div className="carrito-lista">
              {Object.entries(porDistribuidor).map(([distId, grupo]) => (
                <Tarjeta key={distId} className="col gap-s carrito-grupo">
                  <div className="texto-mudo">{grupo.nombreDistribuidor}</div>
                  {grupo.items.map(item => (
                    <div key={item.id} className="fila gap-m carrito-item">
                      {item.imagenUrl
                        ? <img src={`http://localhost:3000${item.imagenUrl}`} alt={item.nombre} className="carrito-item-img" />
                        : <div className="placeholder-img carrito-item-img">—</div>
                      }
                      <div className="col flex1">
                        <span className="texto">{item.nombre}</span>
                        <span className="texto-mudo">Precio est. ${(precioAplicable(item.tarifas, item.cantidad) || 0).toLocaleString('es-AR')} c/u</span>
                      </div>
                      <div className="fila gap-s">
                        <Boton
                          variante="outline"
                          className="carrito-item-btn"
                          onClick={() => modificarCantidad(item.id, item.cantidad - 1)}
                          aria-label="Restar unidad"
                        >
                          −
                        </Boton>
                        <span className="carrito-item-cantidad">{item.cantidad}</span>
                        <Boton
                          variante="outline"
                          className="carrito-item-btn"
                          onClick={() => modificarCantidad(item.id, item.cantidad + 1)}
                          aria-label="Sumar unidad"
                        >
                          +
                        </Boton>
                      </div>
                      <Boton
                        variante="icono"
                        onClick={() => eliminarProducto(item.id)}
                        aria-label="Eliminar producto"
                      >
                        ✕
                      </Boton>
                    </div>
                  ))}
                </Tarjeta>
              ))}

              <Boton variante="outline" className="carrito-vaciar-btn" onClick={vaciar}>Vaciar carrito</Boton>
            </div>

            <Tarjeta className="col gap-s carrito-resumen">
              <div className="titulo1">Resumen</div>
              <div className="fila" style={{ justifyContent: 'space-between' }}>
                <span className="texto">Productos ({totalItems})</span>
                <span className="texto">${subtotalTotal.toLocaleString('es-AR')}</span>
              </div>
              <p className="texto-mudo" style={{ margin: 0 }}>
                * Los precios son estimados según el precio mínimo publicado. El total final depende del volumen y condiciones del distribuidor.
              </p>
              <Boton
                onClick={() => {
                  if (!localStorage.getItem('token')) {
                    navigate('/login')
                  } else {
                    navigate('/confirmar-pedido')
                  }
                }}
              >
                Confirmar pedido
              </Boton>
            </Tarjeta>
          </div>
        )}

      </div>

      <BottomNav />

    </div>
  )
}

export default Carrito
