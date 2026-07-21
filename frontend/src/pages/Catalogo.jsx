import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Catalogo.css'

function Catalogo() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    axios.get('http://localhost:3000/api/catalogo')
      .then(res => setProductos(res.data))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="catalogo-layout">

      <header className="catalogo-header">
        <div className="catalogo-header-marca">MarketDist</div>
        <div className="catalogo-header-acciones">
          <button className="catalogo-btn-login" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
        </div>
      </header>

      <div className="catalogo-contenido">
        <h1 className="catalogo-titulo">Catálogo de productos</h1>
        <p className="catalogo-subtitulo">Explorá los productos disponibles de nuestros distribuidores.</p>

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

    </div>
  )
}

export default Catalogo
