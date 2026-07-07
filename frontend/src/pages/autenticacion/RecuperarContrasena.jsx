import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function RecuperarContrasena() {
  const [telefonoInput, setTelefonoInput] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const formatearTelefono = (valor) => {
    let numeros = valor.replace(/\D/g, '')
    if (numeros.startsWith('0')) {
      numeros = numeros.substring(1)
    }
    return '+598' + numeros
  }

  const handleRecuperar = async () => {
    const telefono = formatearTelefono(telefonoInput)
    try {
      const res = await axios.post('http://localhost:3000/auth/recuperarContrasena', { telefono })
      setMensaje(res.data.mensaje)
      navigate('/verificarRecuperacion', { state: { telefono, codigoDev: res.data.codigo_dev } })
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Recuperar contraseña</h1>
      <label>+598</label>
      <input placeholder='99 123 456' value={telefonoInput} onChange={e => setTelefonoInput(e.target.value)} />
      <br /><br />
      <button onClick={handleRecuperar}>Enviar código</button>
      <p>{mensaje}</p>
    </div>
  )
}

export default RecuperarContrasena