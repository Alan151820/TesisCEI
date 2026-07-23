import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import './Inicio.css'
import './EditarPerfil.css'

const NAV_ITEMS = [
  { label: 'Pedidos', ruta: '/pedidos' },
  { label: 'Productos', ruta: '/inicio' },
  { label: 'Proveedores', ruta: '/proveedores' },
  { label: 'Reparto', ruta: '/reparto' },
  { label: 'Reportes', ruta: '/reportes' },
  { label: 'Empleados', ruta: '/empleados' },
  { label: 'Editar perfil', ruta: '/editarPerfil' },
]

function EditarPerfil() {
  const [nombreComercial, setNombreComercial] = useState('')
  const [descripcionNegocio, setDescripcionNegocio] = useState('')
  const [zonaEntrega, setZonaEntrega] = useState('')
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const telefono = localStorage.getItem('telefono')
  const nombre = localStorage.getItem('nombre') || ''
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const res = await axios.post('http://localhost:3000/distribuidor/obtenerPerfilPropio', { telefono })
        setNombreComercial(res.data.nombreComercial)
        setDescripcionNegocio(res.data.descripcionNegocio)
        setZonaEntrega(res.data.zonaEntrega)
        if (res.data.logoUrl) setLogoPreview(`http://localhost:3000${res.data.logoUrl}`)
      } catch (error) {
        setMensaje('No fue posible cargar el perfil.')
      }
    }
    cargarPerfil()
  }, [])

  const handleLogo = (e) => {
    const archivo = e.target.files[0]
    setLogo(archivo)
    setLogoPreview(URL.createObjectURL(archivo))
  }

  const handleEditar = async () => {
    try {
      await axios.put('http://localhost:3000/distribuidor/editarPerfil', {
        telefono,
        nombreComercial,
        descripcionNegocio,
        zonaEntrega
      })

      if (logo) {
        const formData = new FormData()
        formData.append('logo', logo)
        formData.append('telefono', telefono)
        await axios.post('http://localhost:3000/distribuidor/subirLogo', formData)
      }

      setMensaje('Perfil actualizado correctamente.')
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    }
  }

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    navigate('/login')
  }

  return (
    <div className="panel-root">

      <header className="panel-master-header">
        <div className="panel-master-header-marca">MarketDist</div>
        <div className="panel-master-header-buscador">
          <span className="panel-master-header-buscador-icono">⌕</span>
          <input className="panel-master-header-buscador-input" type="text" placeholder="Buscar productos…" />
        </div>
        <div className="panel-master-header-perfil">
          <div className="panel-master-header-avatar">{iniciales}</div>
        </div>
      </header>

      <div className="panel-layout">

        <aside className="panel-sidebar">
          <div className="panel-sidebar-marca">
            <div className="panel-sidebar-titulo">MarketDist</div>
            <div className="panel-sidebar-subtitulo">Panel del Distribuidor</div>
          </div>

          <nav className="panel-nav">
            {NAV_ITEMS.map(item => (
              <div
                key={item.ruta}
                className={`panel-nav-item${location.pathname === item.ruta ? ' activo' : ''}`}
                onClick={() => navigate(item.ruta)}
              >
                {item.label}
              </div>
            ))}
          </nav>

          <div className="panel-sidebar-cambiar-modo">
            <button className="panel-sidebar-cambiar-btn" onClick={() => navigate('/inicioComprador')}>
              ← Cambiar a modo comprador
            </button>
          </div>

          <div className="panel-sidebar-footer">
            <div className="panel-sidebar-usuario">
              <div className="panel-avatar-small">{iniciales}</div>
              <div>
                <div className="panel-sidebar-nombre">{nombre}</div>
                <div className="panel-sidebar-rol">Distribuidor</div>
              </div>
            </div>
            <div className="panel-sidebar-accion" onClick={handleCerrarSesion}>Cerrar sesión</div>
          </div>
        </aside>

        <main className="panel-main">
        <div className="panel-contenido">

          <div className="panel-seccion-header">
            <div>
              <h1 className="panel-h1">Editar perfil</h1>
              <p className="panel-subtitulo">Actualizá los datos de tu distribuidora visibles para los compradores.</p>
            </div>
          </div>

          <div className="editarperfil-card">

            <div className="editarperfil-logo-fila">
              <div className="editarperfil-logo-zona" onClick={() => document.getElementById('input-logo').click()}>
                {logoPreview
                  ? <img src={logoPreview} alt='Logo' className="editarperfil-logo-preview" />
                  : <span className="editarperfil-logo-texto">+ Subir logo</span>
                }
              </div>
              <input
                id="input-logo"
                type='file'
                accept='image/*'
                style={{ display: 'none' }}
                onChange={handleLogo}
              />
            </div>

            <div className="editarperfil-campo">
              <label className="editarperfil-label">Nombre comercial</label>
              <input
                className="editarperfil-input"
                placeholder='Nombre comercial *'
                value={nombreComercial}
                onChange={e => setNombreComercial(e.target.value)}
              />
            </div>

            <div className="editarperfil-campo">
              <label className="editarperfil-label">Descripción</label>
              <textarea
                className="editarperfil-textarea"
                placeholder='Descripción del negocio'
                value={descripcionNegocio}
                onChange={e => setDescripcionNegocio(e.target.value)}
              />
            </div>

            <div className="editarperfil-campo">
              <label className="editarperfil-label">Zona de entrega</label>
              <input
                className="editarperfil-input"
                placeholder='Zona de entrega'
                value={zonaEntrega}
                onChange={e => setZonaEntrega(e.target.value)}
              />
            </div>

            <div className="editarperfil-acciones">
              <button className="editarperfil-btn-guardar" onClick={handleEditar}>Guardar cambios</button>
              <button className="editarperfil-btn-cancelar" onClick={() => navigate('/inicio')}>Volver al panel</button>
            </div>

            <p className="editarperfil-mensaje">{mensaje}</p>

          </div>

        </div>
        </main>

      </div>
    </div>
  )
}

export default EditarPerfil
