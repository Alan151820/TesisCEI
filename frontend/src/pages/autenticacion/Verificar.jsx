import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

function Verificar() {
  const [codigo, setCodigo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const telefono = location.state?.telefono
  const codigoDev = location.state?.codigoDev

  const handleVerificar = async () => {
    try {
      const res = await axios.post('http://localhost:3000/auth/verificar', {
        telefono,
        codigo
      })
      setMensaje(res.data.mensaje)
      navigate('/inicio')
    } catch (error) {
      setMensaje(error.response.data.mensaje)
    }
  }

  return (
    <div>
      <h1>Verificar cuenta</h1>
      <p>Ingresá el código que te enviamos al {telefono}</p>
      {codigoDev && <p>Código de desarrollo: {codigoDev}</p>}
      <input placeholder='Código de 6 dígitos' value={codigo} onChange={e => setCodigo(e.target.value)} />
      <br />
      <button onClick={handleVerificar}>Verificar</button>
      <p>{mensaje}</p>
    </div>
  )
}

export default Verificar