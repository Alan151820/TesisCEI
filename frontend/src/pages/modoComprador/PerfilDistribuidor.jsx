import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import api from '../../lib/axios'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNavComprador from '../../components/BottomNavComprador'
import { construirTituloProducto } from '../../lib/producto'
import './PerfilDistribuidor.css'

function PerfilDistribuidor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const nombre = localStorage.getItem('nombre') || ''
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const { totalItems } = useCarrito()

  const [distribuidor, setDistribuidor] = useState(null)
  const [productos, setProductos] = useState([])
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        const res = await api.get(`/distribuidor/perfilDistribuidor/${id}`)
        setDistribuidor(res.data)
      } catch (error) {
        setMensaje(error.response?.data?.mensaje || 'No fue posible completar la operación. Intente nuevamente más tarde.')
      }
    }

    const obtenerProductos = async () => {
      try {
        const res = await api.get(`/distribuidor/${id}/productos`)
        setProductos(res.data)
      } catch {
        setProductos([])
      }
    }

    obtenerPerfil()
    obtenerProductos()
  }, [id])

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('telefono')
    localStorage.removeItem('modoDistribuidorActivo')
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/catalogo', { replace: true })
  }

  if (mensaje) return <p className="perfildist-mensaje-pagina">{mensaje}</p>
  if (!distribuidor) return <p className="perfildist-mensaje-pagina">Cargando...</p>

  const calificacionRedondeada = distribuidor.calificacionPromedio ? Math.round(distribuidor.calificacionPromedio) : 0

  return (
    <div className="perfildist-fondo">

      <div className="perfildist-mobile-header">
        <button type="button" className="perfildist-mobile-volver" onClick={() => window.history.back()}>←</button>
        <div className="perfildist-mobile-titulo">Perfil del distribuidor</div>
      </div>

      <header className="perfildist-topbar">
        <div className="perfildist-marca" onClick={() => navigate(token ? '/inicioComprador' : '/catalogo')}>MarketPlace</div>
        <div className="perfildist-buscador">
          <span className="perfildist-buscador-icono">⌕</span>
          <span className="perfildist-buscador-texto">Buscar productos…</span>
        </div>
        <div className="perfildist-topbar-acciones">
          {token ? (
            <>
              <button className="perfildist-btn-carrito" onClick={() => navigate('/carrito')}>
                🛒{totalItems > 0 && <span className="perfildist-carrito-badge">{totalItems}</span>}
              </button>
              <button className="perfildist-btn-distribuidora" onClick={() => navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil')}>
                Distribuidora
              </button>
              <CampanaNotificaciones rutaDestino="/misPedidos" rutaDetalle="/pedido" />
              <div className="perfildist-perfil">
                <div className="perfildist-avatar">{iniciales}</div>
                <span className="perfildist-nombre-usuario">{nombre}</span>
              </div>
              <button className="perfildist-btn-cerrar-sesion" onClick={cerrarSesion}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button className="perfildist-btn-carrito" onClick={() => navigate('/carrito')}>
                🛒{totalItems > 0 && <span className="perfildist-carrito-badge">{totalItems}</span>}
              </button>
              <button className="perfildist-btn-login" onClick={() => navigate('/login')}>Iniciar sesión</button>
              <button className="perfildist-btn-registro" onClick={() => navigate('/registro')}>Registrarse</button>
            </>
          )}
        </div>
      </header>

      <div className="perfildist-cabecera">
        <div className="perfildist-logo">
          {distribuidor.logoUrl
            ? <img src={`http://localhost:3000${distribuidor.logoUrl}`} alt='Logo del distribuidor' className="perfildist-logo-img" />
            : <span className="perfildist-logo-placeholder">[logo]</span>
          }
        </div>
        <div className="perfildist-datos">
          <h1 className="perfildist-nombre">{distribuidor.nombreComercial}</h1>
          <p className="perfildist-descripcion">{distribuidor.descripcionNegocio}</p>
          <div className="perfildist-info-fila">
            <div className="perfildist-info-bloque">
              <span className="perfildist-info-label">Zona de entrega</span>
              <span className="perfildist-info-valor">{distribuidor.zonaEntrega}</span>
            </div>
            <div className="perfildist-info-bloque">
              <span className="perfildist-info-label">Calificación</span>
              {distribuidor.calificacionPromedio ? (
                <div className="perfildist-calificacion">
                  <span className="perfildist-estrellas">
                    {[1, 2, 3, 4, 5].map(n => (
                      <span key={n} className={n <= calificacionRedondeada ? 'perfildist-estrella-llena' : 'perfildist-estrella-vacia'}>★</span>
                    ))}
                  </span>
                  <span className="perfildist-info-valor">{distribuidor.calificacionPromedio} / 5</span>
                </div>
              ) : (
                <span className="perfildist-info-valor">Sin calificaciones</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="perfildist-catalogo">
        <h2 className="perfildist-catalogo-titulo">Productos publicados ({productos.length})</h2>

        {productos.length === 0 ? (
          <p className="perfildist-catalogo-vacio">Este distribuidor no tiene productos publicados actualmente.</p>
        ) : (
          <div className="perfildist-grid">
            {productos.map(p => (
              <div key={p.id} className="perfildist-producto-card" onClick={() => navigate(`/producto/${p.id}`, { replace: true })}>
                {p.imagenUrl
                  ? <img src={`http://localhost:3000${p.imagenUrl}`} alt={p.nombre} className="perfildist-producto-img" />
                  : <div className="perfildist-producto-img-placeholder">[foto]</div>
                }
                <div className="perfildist-producto-info">
                  <div className="perfildist-producto-categoria">{p.categoria}</div>
                  <h3 className="perfildist-producto-nombre">{construirTituloProducto(p)}</h3>
                  <p className="perfildist-producto-descripcion">{p.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {token && <BottomNavComprador />}

    </div>
  )
}

export default PerfilDistribuidor