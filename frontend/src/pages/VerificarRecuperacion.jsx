import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

function VerificarRecuperacion() {
  const [codigo, setCodigo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const telefono = location.state?.telefono
  const codigoDev = location.state?.codigoDev

  const handleVerificar = async () => {
    try {
      const res = await axios.post('http://localhost:3000/auth/verificarRecuperacion', { telefono, codigo })
      setMensaje(res.data.mensaje)
      navigate('/nuevaContrasena', { state: { telefono } })
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Verificar código</h1>
      <p>Ingresá el código que te enviamos al {telefono}</p>
      {codigoDev && <p>Código de desarrollo: {codigoDev}</p>}
      <input placeholder='Código de 6 dígitos' value={codigo} onChange={e => setCodigo(e.target.value)} />
      <br /><br />
      <button onClick={handleVerificar}>Verificar</button>
      <p>{mensaje}</p>
    </div>
  )
}

export default VerificarRecuperacion