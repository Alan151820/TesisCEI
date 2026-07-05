import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

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
    <div>
      <h1>Crear cuenta</h1>
      <input placeholder='Nombre completo' value={nombre} onChange={e => setNombre(e.target.value)} />
      <br />
      <label>+598</label>
      <input placeholder='99 123 456' value={telefonoInput} onChange={e => setTelefonoInput(e.target.value)} />
      <br />
      <input placeholder='Contraseña' type='password' value={contrasena} onChange={e => setContrasena(e.target.value)} />
      <br />
      <button onClick={handleRegistro}>Registrarse</button>
      <p>{mensaje}</p>
    </div>
  )
}

export default Registro