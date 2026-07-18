import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Registro.css'

function Registro() {
  const [nombre, setNombre] = useState('')
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

  const handleRegistro = async () => {
    const telefono = formatearTelefono(telefonoInput)
    try {
      const res = await axios.post('http://localhost:3000/auth/registro', {
        nombre,
        telefono,
        contrasena
      })
      setMensaje(res.data.mensaje)
      navigate('/verificar', { state: { telefono, nombre, codigoDev: res.data.codigo_dev } })
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div className="registro-pagina">
      <header className="registro-encabezado">
        <span className="registro-logo">MarketPlace</span>

        <div className="registro-buscador">
          <span className="registro-buscador-icono">⌕</span>
          <span className="registro-buscador-texto">Buscar productos…</span>
        </div>

        <div className="registro-encabezado-derecha">
          <span className="registro-encabezado-link">Iniciar sesión</span>
          <button type="button" className="registro-encabezado-boton">Registrarse</button>
        </div>
      </header>

      <main className="registro-contenido">
        <div className="registro-tarjeta">
          <h1 className="registro-titulo">Crear cuenta</h1>
          <p className="registro-subtitulo">Completá tus datos para registrarte.</p>

          <div className="registro-campo">
            <label className="registro-etiqueta">Nombre completo</label>
            <input
              className="registro-input"
              placeholder="María García"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
          </div>

          <div className="registro-campo">
            <label className="registro-etiqueta">Número de teléfono</label>
            <input
              className="registro-input"
              placeholder="099 123 456"
              value={telefonoInput}
              onChange={e => setTelefonoInput(e.target.value)}
            />
            <span className="registro-ayuda">Se usará para verificar tu identidad y recuperar tu contraseña.</span>
          </div>

          <div className="registro-campo">
            <label className="registro-etiqueta">Contraseña</label>
            <input
              className="registro-input"
              type="password"
              placeholder="••••••••"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
            />
            <span className="registro-ayuda">Mínimo 8 caracteres.</span>
          </div>

          <label className="registro-consentimiento">
            <input type="checkbox" className="registro-checkbox" />
            <span className="registro-consentimiento-texto">
              Acepto el tratamiento de mis datos personales conforme a la <u>Política de privacidad</u>.
            </span>
          </label>

          <button
            type="button"
            className="registro-boton-crear"
            onClick={handleRegistro}
          >
            Crear cuenta
          </button>

          <div className="registro-paso-info">
            <strong>Paso 2/2:</strong> Una vez enviado el formulario, ingresá el código de verificación que recibirás por SMS.
          </div>

          {mensaje && <p className="registro-mensaje-error">{mensaje}</p>}

          <p className="registro-pie">
            ¿Ya tenés cuenta? <button type="button" className="registro-pie-link">Iniciá sesión</button>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Registro
