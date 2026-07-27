import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import api from '../lib/axios'
import './Catalogo.css'

function Catalogo() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const token = localStorage.getItem('token')
  const { agregarProducto, totalItems } = useCarrito()

  useEffect(() => {
    api.get('/api/catalogo')
      .then(res => setProductos(res.data))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="catalogo-layout">

      <header className="catalogo-header">
        <div className="catalogo-header-marca">MarketDist</div>
        <div className="catalogo-header-buscador">
          <span className="catalogo-header-buscador-icono">⌕</span>
          <input
            className="catalogo-header-buscador-input"
            type="text"
            placeholder="Buscar productos…"
          />
        </div>
        <div className="catalogo-header-acciones">
          <button className="catalogo-btn-carrito" onClick={() => navigate('/carrito')}>
            🛒{totalItems > 0 && <span className="catalogo-carrito-badge">{totalItems}</span>}
          </button>
          <button className="catalogo-btn-login" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
          <button className="catalogo-btn-registro" onClick={() => navigate('/registro')}>
            Registrarse
          </button>
        </div>
      </header>

      <div className="catalogo-contenido">

        <div className="catalogo-filtros-mobile">
          <button className="catalogo-filtros-btn">▽ Filtros</button>
        </div>

        {cargando && (
          <div className="catalogo-vacio">Cargando productos...</div>
        )}

        {!cargando && productos.length === 0 && (
          <div className="catalogo-vacio">No hay productos disponibles en este momento.</div>
        )}

        {!cargando && productos.length > 0 && (
          <>
            <div className="catalogo-grilla">
              {productos.map(p => (
                <div key={p.id} className="catalogo-tarjeta">
                  {p.imagenUrl
                    ? <img
                        src={`http://localhost:3000${p.imagenUrl}`}
                        alt={p.nombre}
                        className="catalogo-tarjeta-imagen"
                      />
                    : <div className="catalogo-tarjeta-imagen-placeholder">Sin imagen</div>
                  }
                  <div className="catalogo-tarjeta-cuerpo">
                    <div className="catalogo-tarjeta-categoria">{p.categoria}</div>
                    <div className="catalogo-tarjeta-nombre">{p.nombre}</div>
                    {p.descripcion && (
                      <div className="catalogo-tarjeta-descripcion">{p.descripcion}</div>
                    )}
                    <div className="catalogo-tarjeta-pie">
                      <div className="catalogo-tarjeta-distribuidor">{p.nombreDistribuidor}</div>
                      <div className="catalogo-tarjeta-precio">
                        Desde ${Number(p.precioMinimo).toLocaleString('es-AR')}
                      </div>
                    </div>
                    <button
                      className="catalogo-tarjeta-agregar"
                      onClick={() => agregarProducto(p)}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="catalogo-contador">
              {productos.length} producto{productos.length !== 1 ? 's' : ''} disponible{productos.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>

      <nav className="catalogo-bottom-nav">
        <div className="catalogo-bottom-item activo">
          <span className="catalogo-bottom-icono">◻</span>
          <span className="catalogo-bottom-label">Catálogo</span>
        </div>
        <div className="catalogo-bottom-item catalogo-bottom-carrito" onClick={() => navigate('/carrito')}>
          <span className="catalogo-bottom-icono">
            🛒{totalItems > 0 && <span className="catalogo-bottom-badge">{totalItems}</span>}
          </span>
          <span className="catalogo-bottom-label">Carrito</span>
        </div>
        {token ? (
          <div className="catalogo-bottom-item" onClick={() => navigate('/inicio')}>
            <span className="catalogo-bottom-icono">⊞</span>
            <span className="catalogo-bottom-label">Panel</span>
          </div>
        ) : (
          <div className="catalogo-bottom-item" onClick={() => navigate('/login')}>
            <span className="catalogo-bottom-icono">○</span>
            <span className="catalogo-bottom-label">Cuenta</span>
          </div>
        )}
      </nav>

    </div>
  )
}

export default Catalogo
