import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Verificar.css'

function Verificar() {
  const [codigo, setCodigo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const telefono = location.state?.telefono
  const nombre = location.state?.nombre
  const codigoDev = location.state?.codigoDev

  const handleVerificar = async () => {
    try {
      const res = await axios.post('http://localhost:3000/auth/verificar', {
        telefono,
        codigo
      })
      localStorage.setItem('telefono', telefono)
      localStorage.setItem('nombre', res.data.nombre || nombre)
      localStorage.setItem('modoDistribuidorActivo', 'false')
      localStorage.setItem('token', res.data.token)
      navigate('/inicioComprador')
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div className="verificar-pagina">
      <header className="verificar-encabezado">
        <span className="verificar-logo">MarketPlace</span>

        <div className="verificar-buscador">
          <span className="verificar-buscador-icono">⌕</span>
          <input
            className="verificar-buscador-input"
            type="text"
            placeholder="Buscar productos…"
          />
        </div>

        <div className="verificar-encabezado-derecha">
          <div className="auth-tabs">
            <button type="button" className="auth-tab" onClick={() => navigate('/login')}>Iniciar sesión</button>
            <button type="button" className="auth-tab activo">Registrarse</button>
          </div>
        </div>
      </header>

      <main className="verificar-contenido">
        <div className="verificar-tarjeta">
          <h1 className="verificar-titulo">Verificar cuenta</h1>
          <p className="verificar-subtitulo">Ingresá el código que te enviamos al {telefono}</p>

          {codigoDev && <p className="verificar-codigo-dev">Código de desarrollo: {codigoDev}</p>}

          <div className="verificar-campo">
            <label className="verificar-etiqueta">Código de verificación</label>
            <input
              className="verificar-input"
              placeholder="Código de 6 dígitos"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="verificar-boton"
            onClick={handleVerificar}
          >
            Verificar
          </button>

          {mensaje && <p className="verificar-mensaje-error">{mensaje}</p>}
        </div>
      </main>
    </div>
  )
}

export default Verificar
