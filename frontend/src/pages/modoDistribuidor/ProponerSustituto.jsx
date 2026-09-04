import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import './Inicio.css'
import './EditarPerfil.css'
import './ProponerSustituto.css'

function ProponerSustituto() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [itemsElegibles, setItemsElegibles] = useState([])
  const [catalogoCompleto, setCatalogoCompleto] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [itemSeleccionadoId, setItemSeleccionadoId] = useState(null)
  const [sustitutoId, setSustitutoId] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')

  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  useEffect(() => {
    Promise.all([
      api.get(`/api/pedidos/${id}/detalle`),
      api.get('/api/productos?visibilidad=publicado'),
    ])
      .then(([resPedido, resProductos]) => {
        const elegibles = resPedido.data.items.filter(i => !i.propuestaSustitucion)
        setItemsElegibles(elegibles)
        setCatalogoCompleto(resProductos.data)
        if (elegibles.length === 1) setItemSeleccionadoId(elegibles[0].pedidoItemId)
      })
      .catch(err => setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'))
      .finally(() => setCargando(false))
  }, [id])

  const itemOriginal = itemsElegibles.find(i => i.pedidoItemId === itemSeleccionadoId) || null
  const catalogo = itemOriginal ? catalogoCompleto.filter(p => p.id !== itemOriginal.productoId) : []

  const handleEnviar = async () => {
    if (!sustitutoId) {
      setErrorEnvio('Seleccioná un producto sustituto antes de enviar la propuesta.')
      return
    }
    setErrorEnvio('')
    setEnviando(true)
    try {
      await api.post(`/api/pedidos/${id}/items/${itemSeleccionadoId}/proponer-sustituto`, {
        productoSustitutoId: sustitutoId,
      })
      navigate(`/pedidos/${id}`)
    } catch (err) {
      setErrorEnvio(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <PanelDistribuidor tituloMobile="Proponer sustituto" activo="/pedidos">
          <div className="detallepedido-migas">
            <span className="detallepedido-miga-link" onClick={() => navigate(`/pedidos/${id}`)}>Pedido #{id}</span>
            <span className="detallepedido-miga-separador">›</span>
            <span className="detallepedido-miga-actual">Proponer sustituto</span>
          </div>

          <div className="panel-seccion-header">
            <div>
              <h1 className="panel-h1">Proponer sustituto de producto</h1>
              <p className="panel-subtitulo">Seleccioná un producto de tu catálogo para reemplazar el artículo solicitado.</p>
            </div>
          </div>

          {cargando && <div className="panel-tabla-vacio">Cargando...</div>}

          {!cargando && error && (
            <div className="panel-tabla-vacio pedidos-error">{error}</div>
          )}

          {!cargando && !error && itemsElegibles.length === 0 && (
            <div className="panel-tabla-vacio">No hay artículos disponibles para proponer un sustituto en este pedido.</div>
          )}

          {!cargando && !error && itemsElegibles.length > 1 && !itemSeleccionadoId && (
            <div className="editarperfil-card sustituto-card-original">
              <div className="sustituto-etiqueta">Este pedido tiene varios artículos</div>
              <p className="sustituto-subtitulo-lista" style={{ marginTop: 0 }}>Seleccioná cuál querés sustituir:</p>
              {itemsElegibles.map(item => (
                <label key={item.pedidoItemId} className="sustituto-item-picker-opcion">
                  <input
                    type="radio"
                    name="itemASustituir"
                    onChange={() => setItemSeleccionadoId(item.pedidoItemId)}
                  />
                  {item.nombreProducto} — {Number(item.cantidad)} unidades
                </label>
              ))}
              <div className="editarperfil-acciones sustituto-acciones">
                <button className="editarperfil-btn-cancelar" onClick={() => navigate(`/pedidos/${id}`)}>Cancelar</button>
              </div>
            </div>
          )}

          {!cargando && !error && itemOriginal && (
            <>
              <div className="editarperfil-card sustituto-card-original">
                <div className="sustituto-etiqueta">Producto a sustituir</div>
                <div className="sustituto-nombre-original">{itemOriginal.nombreProducto}</div>
                <div className="sustituto-cantidad-original">Cantidad original: {Number(itemOriginal.cantidad)} unidades</div>
                {itemsElegibles.length > 1 && (
                  <button
                    type="button"
                    className="detallepedido-producto-link"
                    onClick={() => {
                      setItemSeleccionadoId(null)
                      setSustitutoId(null)
                    }}
                  >
                    Cambiar artículo
                  </button>
                )}
              </div>

              <p className="sustituto-subtitulo-lista">Seleccioná el sustituto de tu catálogo:</p>

              {catalogo.length === 0 ? (
                <div className="panel-tabla-vacio">No tenés otros productos publicados en tu catálogo para ofrecer como sustituto.</div>
              ) : (
                <div className="panel-tabla-wrapper sustituto-tabla-wrapper">
                  <div className="sustituto-tabla-header">
                    <div></div>
                    <div>Producto</div>
                    <div>Stock disp.</div>
                  </div>
                  {catalogo.map(p => (
                    <label key={p.id} className="sustituto-tabla-fila">
                      <div className="sustituto-celda">
                        <input
                          type="radio"
                          name="sustituto"
                          checked={sustitutoId === p.id}
                          onChange={() => setSustitutoId(p.id)}
                        />
                      </div>
                      <div className="sustituto-celda sustituto-celda-producto">
                        {p.imagenUrl
                          ? <img src={`http://localhost:3000${p.imagenUrl}`} alt={p.nombre} className="detallepedido-thumb" />
                          : <span className="detallepedido-thumb detallepedido-thumb-sinimg">Sin imagen</span>
                        }
                        {p.nombre}
                      </div>
                      <div className="sustituto-celda">{p.stockDisponible} u.</div>
                    </label>
                  ))}
                </div>
              )}

              <div className="editarperfil-acciones sustituto-acciones">
                <button className="editarperfil-btn-guardar" onClick={handleEnviar} disabled={enviando}>
                  {enviando ? 'Enviando…' : 'Enviar propuesta al comprador'}
                </button>
                <button className="editarperfil-btn-cancelar" onClick={() => navigate(`/pedidos/${id}`)}>Cancelar</button>
              </div>

              {errorEnvio && <p className="editarperfil-mensaje" style={{ color: 'var(--color-error)' }}>{errorEnvio}</p>}

              <p className="sustituto-nota">El pedido permanece en estado Pendiente mientras el comprador no responda la propuesta.</p>
            </>
          )}
    </PanelDistribuidor>
  )
}

export default ProponerSustituto
