import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

function NuevaContrasena() {
  const [contrasena, setContrasena] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const telefono = location.state?.telefono

  const handleNuevaContrasena = async () => {
    if (contrasena !== confirmar) {
      setMensaje('Las contraseñas no coinciden.')
      return
    }
    try {
      const res = await axios.post('http://localhost:3000/auth/nuevaContrasena', { telefono, contrasena })
      setMensaje(res.data.mensaje)
      navigate('/login')
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Nueva contraseña</h1>
      <input placeholder='Nueva contraseña' type='password' value={contrasena} onChange={e => setContrasena(e.target.value)} />
      <br /><br />
      <input placeholder='Confirmar contraseña' type='password' value={confirmar} onChange={e => setConfirmar(e.target.value)} />
      <br /><br />
      <button onClick={handleNuevaContrasena}>Guardar</button>
      <p>{mensaje}</p>
    </div>
  )
}

export default NuevaContrasena