import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { useCarrito } from '../../context/CarritoContext'
import { precioAplicable } from '../../lib/precios'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNav from '../../components/BottomNav'
import MenuPerfilComprador from '../../components/MenuPerfilComprador'
import Hdr from '../../components/Hdr'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Tarjeta from '../../components/ui/Tarjeta'
import Tabla from '../../components/ui/Tabla'
import TablaHeader from '../../components/ui/TablaHeader'
import TablaFila from '../../components/ui/TablaFila'
import Miga from '../../components/ui/Miga'
import EstadoLista from '../../components/ui/EstadoLista'
import { construirTituloProducto } from '../../lib/producto'
import './InicioComprador.css'
import './DetalleProducto.css'
import Marca from '../../components/Marca'

function DetalleProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
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
        setMensaje(mensajeDeError(err))
      })
  }, [id])

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
          <span className="detalleproducto-header-buscador-icono">🔍</span>
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
        <Boton variante="ghost" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>← Volver</Boton>
        <Miga items={[{ etiqueta: 'Catálogo' }, { etiqueta: producto.categoria }, { etiqueta: producto.nombre }]} className="detalleproducto-breadcrumb" />

        <div className="fila gap-l detalleproducto-fila">
          {producto.imagenUrl
            ? <img src={`http://localhost:3000${producto.imagenUrl}`} alt={producto.nombre} className="detalleproducto-imagen" />
            : <div className="placeholder-img detalleproducto-imagen">imagen</div>
          }

          <div className="col gap-s flex1">
            <span className="texto-mudo">
              {producto.categoria} ·{' '}
              <button
                className="link"
                onClick={() => navigate(`/perfilDistribuidor/${producto.distribuidorId}`, { replace: true })}
              >
                {producto.nombreDistribuidor}
              </button>
            </span>

            <div className="titulo1">{titulo}</div>
            <p className="texto detalleproducto-descripcion">{producto.descripcion}</p>

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

            <div className="titulo1">Precios por volumen</div>
            {producto.tarifas.length === 0 ? (
              <EstadoLista className="detalleproducto-tarifas-tabla">Este producto no tiene tarifas disponibles actualmente.</EstadoLista>
            ) : (
              <Tabla grid="1fr 1fr" className="detalleproducto-tarifas-tabla">
                <TablaHeader columnas={['Cantidad mínima', 'Precio unitario']} />
                {producto.tarifas.map((t, i) => (
                  <TablaFila key={i}>
                    <div>{t.cantidadMinima} u.</div>
                    <div>${Number(t.precioVenta).toLocaleString('es-AR')}</div>
                  </TablaFila>
                ))}
              </Tabla>
            )}

            <Tarjeta className="col gap-s detalleproducto-carrito-caja">
              <div className="titulo1">Agregar al carrito</div>
              {producto.tarifas.length > 0 && (
                <>
                  <div className="fila gap-s">
                    <Boton
                      variante="outline"
                      className="detalleproducto-stepper-btn"
                      onClick={decrementar}
                      aria-label="Restar unidad"
                    >
                      −
                    </Boton>
                    <Campo
                      type="number"
                      className="detalleproducto-stepper-valor"
                      min="1"
                      value={cantidad}
                      onChange={handleCantidadChange}
                      onBlur={handleCantidadBlur}
                    />
                    <Boton
                      variante="outline"
                      className="detalleproducto-stepper-btn"
                      onClick={incrementar}
                      aria-label="Sumar unidad"
                    >
                      +
                    </Boton>
                    <span className="texto-mudo">unidades</span>
                  </div>
                  <div className="detalleproducto-carrito-cantidad-info">
                    ${precioAplicable(producto.tarifas, cantidad).toLocaleString('es-AR')} c/u
                  </div>
                </>
              )}
              {token ? (
                <Boton onClick={() => agregarProducto(producto, Number(cantidad) || 1)}>
                  Agregar al carrito
                </Boton>
              ) : (
                <>
                  <Boton disabled>Agregar al carrito</Boton>
                  <div className="detalleproducto-carrito-nota">Iniciá sesión para comprar</div>
                </>
              )}
            </Tarjeta>
          </div>
        </div>
      </div>

      {token && <BottomNav />}

    </div>
  )
}

export default DetalleProducto
