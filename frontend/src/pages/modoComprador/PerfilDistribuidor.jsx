import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

function PerfilDistribuidor() {
  const { id } = useParams()
  const [distribuidor, setDistribuidor] = useState(null)
  const [productos, setProductos] = useState([])
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

    const obtenerProductos = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/distribuidor/${id}/productos`)
        setProductos(res.data)
      } catch {
        setProductos([])
      }
    }

    obtenerPerfil()
    obtenerProductos()
  }, [id])

  if (mensaje) return <p>{mensaje}</p>
  if (!distribuidor) return <p>Cargando...</p>

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      {distribuidor.logoUrl && <img src={`http://localhost:3000${distribuidor.logoUrl}`} alt='Logo del distribuidor' width={100} style={{ borderRadius: '50%' }} />}
      <h1>{distribuidor.nombreComercial}</h1>
      <p>{distribuidor.descripcionNegocio}</p>
      <p>Zona de entrega: {distribuidor.zonaEntrega}</p>
      <p>Calificación: {distribuidor.calificacionPromedio ? `${distribuidor.calificacionPromedio} / 5` : 'Sin calificaciones'}</p>

      <h2>Productos publicados</h2>
      {productos.length === 0 ? (
        <p>Este distribuidor no tiene productos publicados actualmente.</p>
      ) : (
        <div>
          {productos.map(p => (
            <div key={p.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
              {p.imagenUrl && <img src={`http://localhost:3000${p.imagenUrl}`} alt={p.nombre} width={80} />}
              <h3>{p.nombre}</h3>
              <p>{p.descripcion}</p>
              <p>Categoría: {p.categoria}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PerfilDistribuidor