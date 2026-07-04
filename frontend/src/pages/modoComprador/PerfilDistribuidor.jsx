import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

function PerfilDistribuidor() {
  const { id } = useParams()
  const [distribuidor, setDistribuidor] = useState(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/distribuidor/perfilDistribuidor/${id}`)
        setDistribuidor(res.data)
      } catch (error) {
        setMensaje(error.response?.data?.mensaje || 'No fue posible completar la operación. Intente nuevamente más tarde.')
      }
    }
    obtenerPerfil()
  }, [id])

  if (mensaje) return <p>{mensaje}</p>
  if (!distribuidor) return <p>Cargando...</p>

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      {distribuidor.logoUrl && <img src={distribuidor.logoUrl} alt='Logo del distribuidor' width={100} />}
      <h1>{distribuidor.nombreComercial}</h1>
      <p>{distribuidor.descripcionNegocio}</p>
      <p>Zona de entrega: {distribuidor.zonaEntrega}</p>
      <p>
        Calificación: {distribuidor.calificacionPromedio ? `${distribuidor.calificacionPromedio} / 5` : 'Sin calificaciones'}
      </p>
    </div>
  )
}

export default PerfilDistribuidor