import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
import BottomNav from '../../components/BottomNav'
import MenuPerfilComprador from '../../components/MenuPerfilComprador'
import Hdr from '../../components/Hdr'
import Boton from '../../components/ui/Boton'
import GridCards from '../../components/ui/GridCards'
import CardProducto from '../../components/ui/CardProducto'
import './InicioComprador.css'
import './PerfilDistribuidor.css'
import Marca from '../../components/Marca'

function PerfilDistribuidor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const modoDistribuidorActivo = localStorage.getItem('modoDistribuidorActivo') === 'true'

  const [distribuidor, setDistribuidor] = useState(null)
  const [productos, setProductos] = useState([])
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        const res = await api.get(`/distribuidor/perfilDistribuidor/${id}`)
        setDistribuidor(res.data)
      } catch (error) {
        setMensaje(mensajeDeError(error))
      }
    }

    const obtenerProductos = async () => {
      try {
        const res = await api.get(`/distribuidor/${id}/productos`)
        setProductos(res.data)
      } catch {
        setProductos([])
      }
    }

    obtenerPerfil()
    obtenerProductos()
  }, [id])

  if (mensaje) return <p className="perfildist-mensaje-pagina">{mensaje}</p>
  if (!distribuidor) return <p className="perfildist-mensaje-pagina">Cargando...</p>

  const calificacionRedondeada = distribuidor.calificacionPromedio ? Math.round(distribuidor.calificacionPromedio) : 0

  return (
    <div className="perfildist-fondo">

      <Hdr logo={<span className="hdr-logo" onClick={() => navigate('/')}><Marca /></span>} buscador>
        {token ? (
          <>
            <span className="link" onClick={() => navigate(modoDistribuidorActivo ? '/inicio' : '/configurarPerfil')}>
              Distribuidora
            </span>
            <CampanaNotificaciones rutaDestino="/misPedidos" rutaDetalle="/pedido" />
            <MenuPerfilComprador />
          </>
        ) : (
          <>
            <Boton variante="ghost" onClick={() => navigate('/login')}>Iniciar sesión</Boton>
            <Boton variante="fill" onClick={() => navigate('/registro')}>Registrarse</Boton>
          </>
        )}
      </Hdr>

      <div className="perfildist-cabecera">
        <div className="perfildist-logo">
          {distribuidor.logoUrl
            ? <img src={`http://localhost:3000${distribuidor.logoUrl}`} alt='Logo del distribuidor' className="perfildist-logo-img" />
            : <span className="perfildist-logo-placeholder">[logo]</span>
          }
        </div>
        <div className="perfildist-datos">
          <h1 className="perfildist-nombre">{distribuidor.nombreComercial}</h1>
          <p className="perfildist-descripcion">{distribuidor.descripcionNegocio}</p>
          <div className="perfildist-info-fila">
            <div className="perfildist-info-bloque">
              <span className="perfildist-info-label">Zona de entrega</span>
              <span className="perfildist-info-valor">{distribuidor.zonaEntrega}</span>
            </div>
            <div className="perfildist-info-bloque">
              <span className="perfildist-info-label">Calificación</span>
              {distribuidor.calificacionPromedio ? (
                <div className="fila gap-s">
                  <span className="estrellas">{'★'.repeat(calificacionRedondeada)}{'☆'.repeat(5 - calificacionRedondeada)}</span>
                  <span className="perfildist-info-valor">{distribuidor.calificacionPromedio} / 5</span>
                </div>
              ) : (
                <span className="perfildist-info-valor">Sin calificaciones</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="perfildist-catalogo">
        <h2 className="perfildist-catalogo-titulo">Productos publicados ({productos.length})</h2>

        {productos.length === 0 ? (
          <p className="perfildist-catalogo-vacio">Este distribuidor no tiene productos publicados actualmente.</p>
        ) : (
          <GridCards>
            {productos.map(p => (
              <CardProducto
                key={p.id}
                producto={p}
                compacta
                onClick={() => navigate(`/producto/${p.id}`, { replace: true })}
              />
            ))}
          </GridCards>
        )}
      </div>

      {token && <BottomNav />}

    </div>
  )
}

export default PerfilDistribuidor