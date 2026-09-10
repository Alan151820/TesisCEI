import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { cerrarSesion } from '../lib/auth'
import ToggleTema from './ToggleTema'

function MenuPerfilComprador() {
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  const nombre = localStorage.getItem('nombre') || ''
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const rutaDistribuidora = modoDistribuidorActivo ? '/inicio' : '/configurarPerfil'

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e) => { if (!ref.current?.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [abierto])

  const handleCerrarSesion = () => {
    cerrarSesion()
    navigate('/catalogo')
  }

  return (
    <div className="comprador-perfil-wrapper" ref={ref}>
      <button className="comprador-perfil-trigger" onClick={() => setAbierto(v => !v)}>
        <div className="comprador-avatar">{iniciales}</div>
        <span className="comprador-nombre">{nombre}</span>
        <span className="comprador-perfil-flecha">{abierto ? '▴' : '▾'}</span>
      </button>
      {abierto && (
        <div className="comprador-menu-desplegable">
          <div className="comprador-menu-item comprador-menu-item--mobile" onClick={() => { setAbierto(false); navigate('/misPedidos') }}>Mis pedidos</div>
          <div className="comprador-menu-item comprador-menu-item--mobile" onClick={() => { setAbierto(false); navigate(rutaDistribuidora) }}>Distribuidora</div>
          <ToggleTema />
          <div className="comprador-menu-item" onClick={handleCerrarSesion}>Cerrar sesión</div>
        </div>
      )}
    </div>
  )
}

export default MenuPerfilComprador
