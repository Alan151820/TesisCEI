import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

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
    <div>
      <h1>Iniciar sesión</h1>
      <label>+598</label>
      <input placeholder='99 123 456' value={telefonoInput} onChange={e => setTelefonoInput(e.target.value)} />
      <br />
      <input placeholder='Contraseña' type='password' value={contrasena} onChange={e => setContrasena(e.target.value)} />
      <br />
      <button onClick={() => navigate('/recuperarContrasena')}>¿Olvidaste tu contraseña?</button>
      <br />
      <button onClick={handleLogin}>Ingresar</button>
      <p>{mensaje}</p>
    </div>
  )
}

export default Login