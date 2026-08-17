import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import CampanaNotificaciones from '../../components/CampanaNotificaciones'
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
  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])
  const nombre = localStorage.getItem('nombre') || ''
  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const [menuPerfil, setMenuPerfil] = useState(false)
  const perfilRef = useRef(null)

  useEffect(() => {
    if (!menuPerfil) return
    const cerrar = (e) => { if (!perfilRef.current?.contains(e.target)) setMenuPerfil(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [menuPerfil])

  // RF-046: dirección de partida del depósito, acción separada de RF-053.
  const [direccionPartida, setDireccionPartida] = useState('')
  const [mensajeDireccion, setMensajeDireccion] = useState('')
  const [errorDireccion, setErrorDireccion] = useState('')
  const [guardandoDireccion, setGuardandoDireccion] = useState(false)

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const res = await api.post('/distribuidor/obtenerPerfilPropio')
        setNombreComercial(res.data.nombreComercial)
        setDescripcionNegocio(res.data.descripcionNegocio)
        setZonaEntrega(res.data.zonaEntrega)
        setDireccionPartida(res.data.direccionPartida || '')
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
      await api.put('/distribuidor/editarPerfil', {
        nombreComercial,
        descripcionNegocio,
        zonaEntrega
      })

      if (logo) {
        const formData = new FormData()
        formData.append('logo', logo)
        await api.post('/distribuidor/subirLogo', formData)
      }

      setMensaje('Perfil actualizado correctamente.')
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    }
  }

  const handleGuardarDireccion = async () => {
    setErrorDireccion('')
    setMensajeDireccion('')
    setGuardandoDireccion(true)
    try {
      await api.put('/distribuidor/direccionPartida', { direccionPartida })
      setMensajeDireccion('Dirección de partida registrada correctamente.')
    } catch (error) {
      setErrorDireccion(error.response?.data?.mensaje || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setGuardandoDireccion(false)
    }
  }

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('telefono')
    localStorage.removeItem('modoDistribuidorActivo')
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
          <button className="panel-header-salir-btn" onClick={() => navigate('/inicioComprador')}>
            Salir de distribuidora
          </button>
          <CampanaNotificaciones rutaDestino="/pedidos" />
          <div className="comprador-perfil-wrapper" ref={perfilRef}>
            <button className="comprador-perfil-trigger" onClick={() => setMenuPerfil(v => !v)}>
              <div className="comprador-avatar">{iniciales}</div>
              <span className="comprador-nombre">{nombre}</span>
              <span className="comprador-perfil-flecha">{menuPerfil ? '▴' : '▾'}</span>
            </button>
            {menuPerfil && (
              <div className="comprador-menu-desplegable">
                <div className="comprador-menu-item" onClick={handleCerrarSesion}>Cerrar sesión</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="panel-layout">

        <aside className="panel-sidebar" data-tema="oscuro">
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

          <div className="editarperfil-card">
            <h2 className="panel-h1" style={{ fontSize: '18px', marginBottom: '4px' }}>Dirección de partida del depósito</h2>
            <p className="panel-subtitulo" style={{ marginBottom: '16px' }}>Se usa como referencia para la planificación de reparto.</p>

            <div className="editarperfil-campo">
              <label className="editarperfil-label">Dirección de partida</label>
              <input
                className="editarperfil-input"
                placeholder='Ej: Camino Carrasco 4521, Montevideo'
                value={direccionPartida}
                onChange={e => setDireccionPartida(e.target.value)}
              />
            </div>

            <div className="editarperfil-acciones">
              <button className="editarperfil-btn-guardar" onClick={handleGuardarDireccion} disabled={guardandoDireccion}>
                {guardandoDireccion ? 'Guardando…' : 'Guardar dirección'}
              </button>
            </div>

            {errorDireccion && <p className="editarperfil-mensaje" style={{ color: 'var(--color-error)' }}>{errorDireccion}</p>}
            {mensajeDireccion && <p className="editarperfil-mensaje">{mensajeDireccion}</p>}
          </div>

        </div>
        </main>

      </div>
    </div>
  )
}

export default EditarPerfil
