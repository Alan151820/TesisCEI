import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './login.css'          


function Login() {
  const [telefonoInput, setTelefonoInput] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const formatearTelefono = (valor) => {
    let numeros = valor.replace(/\D/g, '')
    if (numeros.startsWith('0')) {
      numeros = numeros.substring(1)
    }
    return '+598' + numeros
  }

  const handleLogin = async () => {
    const telefono = formatearTelefono(telefonoInput)
    try {
      const res = await axios.post('http://localhost:3000/auth/login', {
        telefono,
        contrasena
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('nombre', res.data.nombre)
      localStorage.setItem('modoDistribuidorActivo', String(res.data.modoDistribuidorActivo))
      localStorage.setItem('telefono', formatearTelefono(telefonoInput))
      navigate('/inicioComprador')
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div className="pagina-inicio-sesion">
      <div className="contenedor-formulario">
        <div className="tarjeta-login">
          <h1 className="titulo-login">Iniciar sesión</h1>
          <p className="subtitulo-login">Usá tu número de teléfono y contraseña.</p>

          <div className="formulario-login">
            <div className="campo">
              <label className="etiqueta-campo">Número de teléfono</label>
              <div className="campo-telefono">
                <span className="prefijo-telefono">+598</span>
                <input
                  className="input-campo"
                  placeholder="99 123 456"
                  value={telefonoInput}
                  onChange={e => setTelefonoInput(e.target.value)}
                />
              </div>
            </div>

            <div className="campo">
              <div className="fila-etiqueta-enlace">
                <label className="etiqueta-campo">Contraseña</label>
                <button
                  type="button"
                  className="boton-enlace enlace-olvido-contrasena"
                  onClick={() => navigate('/recuperarContrasena')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                className="input-campo"
                placeholder="Contraseña"
                type="password"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
              />
            </div>

            <button type="button" className="boton-iniciar-sesion" onClick={handleLogin}>
              Ingresar
            </button>

            {mensaje && <p className="mensaje-error">{mensaje}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login