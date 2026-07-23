import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './InicioComprador.css'

function InicioComprador() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem('nombre') || ''
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    axios.get('http://localhost:3000/api/catalogo')
      .then(res => setProductos(res.data))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false))
  }, [])

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('telefono')
    localStorage.removeItem('modoDistribuidorActivo')
    navigate('/')
  }

  return (
    <div className="comprador-layout">

      <header className="comprador-encabezado">
        <div className="comprador-logo">MarketDist</div>
        <div className="comprador-buscador">
          <span className="comprador-buscador-icono">⌕</span>
          <input
            className="comprador-buscador-input"
            type="text"
            placeholder="Buscar productos…"
          />
        </div>
        <div className="comprador-acciones">
          <button
            className="comprador-cambiar-btn"
            onClick={() => navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil')}
          >
            Distribuidora
          </button>
          <div className="comprador-perfil">
            <div className="comprador-avatar">{iniciales}</div>
            <span className="comprador-nombre">{nombre}</span>
          </div>
          <button className="comprador-cerrar-sesion" onClick={handleCerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="comprador-contenido">

        {cargando && (
          <div className="comprador-vacio">Cargando productos...</div>
        )}

        {!cargando && productos.length === 0 && (
          <div className="comprador-vacio">No hay productos disponibles en este momento.</div>
        )}

        {!cargando && productos.length > 0 && (
          <>
            <div className="comprador-grilla">
              {productos.map(p => (
                <div key={p.id} className="comprador-tarjeta">
                  {p.imagenUrl
                    ? <img src={`http://localhost:3000${p.imagenUrl}`} alt={p.nombre} className="comprador-tarjeta-imagen" />
                    : <div className="comprador-tarjeta-imagen-placeholder">Sin imagen</div>
                  }
                  <div className="comprador-tarjeta-cuerpo">
                    <div className="comprador-tarjeta-categoria">{p.categoria}</div>
                    <div className="comprador-tarjeta-nombre">{p.nombre}</div>
                    {p.descripcion && (
                      <div className="comprador-tarjeta-descripcion">{p.descripcion}</div>
                    )}
                    <div className="comprador-tarjeta-pie">
                      <div className="comprador-tarjeta-distribuidor">{p.nombreDistribuidor}</div>
                      <div className="comprador-tarjeta-precio">
                        Desde ${Number(p.precioMinimo).toLocaleString('es-AR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="comprador-contador">
              {productos.length} producto{productos.length !== 1 ? 's' : ''} disponible{productos.length !== 1 ? 's' : ''}
            </div>
          </>
        )}

      </main>

      <nav className="comprador-bottom-nav">
        <div className="comprador-bottom-item activo">
          <span className="comprador-bottom-icono">◻</span>
          <span className="comprador-bottom-label">Catálogo</span>
        </div>
        <div className="comprador-bottom-item" onClick={() => navigate('/misPedidos')}>
          <span className="comprador-bottom-icono">◇</span>
          <span className="comprador-bottom-label">Pedidos</span>
        </div>
        <div className="comprador-bottom-item">
          <span className="comprador-bottom-icono">○</span>
          <span className="comprador-bottom-label">Cuenta</span>
        </div>
      </nav>

    </div>
  )
}

export default InicioComprador
