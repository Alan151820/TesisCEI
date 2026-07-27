import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido, rutaInicio } from '../../lib/auth'
import { useCarrito } from '../../context/CarritoContext'
import ModalMapaDireccion from '../../components/ModalMapaDireccion'
import './ConfirmacionPedido.css'

const DEPARTAMENTOS = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno',
  'Flores', 'Florida', 'Lavalleja', 'Maldonado', 'Montevideo',
  'Paysandú', 'Río Negro', 'Rivera', 'Rocha', 'Salto',
  'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres',
]

function componer(campos) {
  const { calle, numero, esquina, apto, ciudad, departamento } = campos
  const partes = []
  let linea1 = `${calle.trim()} ${numero.trim()}`
  if (esquina.trim()) linea1 += ` esq. ${esquina.trim()}`
  partes.push(linea1)
  if (apto.trim()) partes.push(apto.trim())
  if (ciudad.trim()) partes.push(ciudad.trim())
  if (departamento) partes.push(departamento)
  partes.push('Uruguay')
  return partes.join(', ')
}

function ConfirmacionPedido() {
  const navigate = useNavigate()
  const { items, vaciar, totalItems } = useCarrito()

  useEffect(() => {
    if (!tokenValido()) navigate('/login')
  }, [navigate])

  // Dirección vía mapa
  const [dirMapa, setDirMapa] = useState(null)
  const [mapaAbierto, setMapaAbierto] = useState(false)

  // Dirección manual
  const [departamento, setDepartamento] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [calle, setCalle] = useState('')
  const [numero, setNumero] = useState('')
  const [esquina, setEsquina] = useState('')
  const [apto, setApto] = useState('')

  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [pedidosConfirmados, setPedidosConfirmados] = useState(null)

  const porDistribuidor = items.reduce((acc, item) => {
    const key = item.distribuidorId
    if (!acc[key]) acc[key] = { nombreDistribuidor: item.nombreDistribuidor, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  const totalEstimado = items.reduce((acc, i) => acc + Number(i.precioMinimo) * i.cantidad, 0)

  const camposManualCompletos = departamento && ciudad.trim() && calle.trim() && numero.trim()

  const getDireccionFinal = () => {
    if (dirMapa) return dirMapa.direccion
    if (camposManualCompletos) return componer({ calle, numero, esquina, apto, ciudad, departamento })
    return ''
  }

  const handleUbicacionConfirmada = ({ lat, lng, direccion }) => {
    setDirMapa({ lat, lng, direccion })
    setMapaAbierto(false)
    setError('')
  }

  const handleConfirmar = async () => {
    setError('')
    const direccionFinal = getDireccionFinal()
    if (!direccionFinal) {
      setError('Seleccioná una ubicación en el mapa o completá los campos obligatorios de dirección.')
      return
    }

    setEnviando(true)
    try {
      const payload = {
        direccionEntrega: direccionFinal,
        latitud: dirMapa?.lat ?? null,
        longitud: dirMapa?.lng ?? null,
        items: items.map(i => ({
          productoId: i.id,
          distribuidorId: i.distribuidorId,
          cantidad: i.cantidad,
        })),
      }
      const res = await api.post('/api/pedidos/confirmar', payload)
      vaciar()
      setPedidosConfirmados(res.data.pedidos)
    } catch (err) {
      setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setEnviando(false)
    }
  }

  const puedeConfirmar = Boolean(getDireccionFinal())

  if (pedidosConfirmados) {
    return (
      <div className="confirmar-pagina">
        <div className="confirmar-mobile-header">
          <div className="confirmar-mobile-titulo">Pedido confirmado</div>
        </div>
        <header className="confirmar-topbar">
          <div className="confirmar-topbar-marca" onClick={() => navigate(rutaInicio())}>MarketDist</div>
          <div className="confirmar-topbar-titulo">Pedido confirmado</div>
        </header>
        <div className="confirmar-contenido">
          <div className="confirmar-exito">
            <div className="confirmar-exito-icono">✓</div>
            <div className="confirmar-exito-titulo">¡Pedido confirmado!</div>
            <div className="confirmar-exito-subtitulo">
              Se generaron {pedidosConfirmados.length} sub-pedido{pedidosConfirmados.length !== 1 ? 's' : ''} independiente{pedidosConfirmados.length !== 1 ? 's' : ''}.
            </div>
            <div className="confirmar-exito-lista">
              {pedidosConfirmados.map((p, i) => (
                <div key={p.pedidoId} className="confirmar-exito-item">
                  <span className="confirmar-exito-label">Sub-pedido {i + 1}</span>
                  <span className="confirmar-exito-num">#{p.pedidoId}</span>
                </div>
              ))}
            </div>
            <button className="confirmar-exito-btn" onClick={() => navigate(rutaInicio())}>
              Volver al catálogo
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (totalItems === 0) {
    return (
      <div className="confirmar-pagina">
        <div className="confirmar-mobile-header">
          <span className="confirmar-mobile-volver" onClick={() => navigate(-1)}>←</span>
          <div className="confirmar-mobile-titulo">Confirmar pedido</div>
        </div>
        <header className="confirmar-topbar">
          <div className="confirmar-topbar-marca" onClick={() => navigate(rutaInicio())}>MarketDist</div>
          <div className="confirmar-topbar-titulo">Confirmar pedido</div>
        </header>
        <div className="confirmar-contenido">
          <div className="confirmar-vacio">El carrito está vacío. No hay pedido para confirmar.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="confirmar-pagina">

      {mapaAbierto && (
        <ModalMapaDireccion
          onConfirmar={handleUbicacionConfirmada}
          onCerrar={() => setMapaAbierto(false)}
        />
      )}

      <div className="confirmar-mobile-header">
        <span className="confirmar-mobile-volver" onClick={() => navigate('/carrito')}>←</span>
        <div className="confirmar-mobile-titulo">Confirmar pedido</div>
      </div>

      <header className="confirmar-topbar">
        <div className="confirmar-topbar-marca" onClick={() => navigate(rutaInicio())}>MarketDist</div>
        <div className="confirmar-topbar-titulo">Confirmar pedido</div>
        <span className="confirmar-topbar-link" onClick={() => navigate('/carrito')}>← Volver al carrito</span>
      </header>

      <div className="confirmar-contenido">
        <div className="confirmar-descripcion">
          Revisá el resumen antes de confirmar. Una vez confirmado, no podrás modificar el pedido.
        </div>

        <div className="confirmar-layout">

          <div className="confirmar-izquierda">

            {/* Resumen */}
            <div className="confirmar-card">
              <div className="confirmar-card-titulo">Resumen del pedido</div>
              {Object.entries(porDistribuidor).map(([distId, grupo]) => {
                const subtotal = grupo.items.reduce((acc, i) => acc + Number(i.precioMinimo) * i.cantidad, 0)
                return (
                  <div key={distId} className="confirmar-resumen-grupo">
                    <div className="confirmar-resumen-dist">{grupo.nombreDistribuidor}</div>
                    {grupo.items.map(item => (
                      <div key={item.id} className="confirmar-resumen-fila">
                        <span>{item.nombre} × {item.cantidad}</span>
                        <span>${(Number(item.precioMinimo) * item.cantidad).toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                    <div className="confirmar-resumen-subtotal">
                      <span>Subtotal</span>
                      <span>${subtotal.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                )
              })}
              <div className="confirmar-resumen-total">
                <span>Total estimado</span>
                <span>${totalEstimado.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {/* Dirección */}
            <div className="confirmar-card">
              <div className="confirmar-card-titulo">Dirección de entrega</div>

              {/* Opción mapa */}
              <div className="confirmar-dir-seccion">
                <div className="confirmar-dir-seccion-titulo">Seleccionar en el mapa</div>
                <div className="confirmar-dir-seccion-desc">
                  Indicá el punto exacto de entrega arrastrando el pin.
                </div>

                {dirMapa && (
                  <div className="confirmar-dir-mapa-resultado">
                    <span className="confirmar-dir-mapa-icono">📍</span>
                    <span className="confirmar-dir-mapa-texto">{dirMapa.direccion}</span>
                    <button
                      className="confirmar-dir-mapa-limpiar"
                      onClick={() => setDirMapa(null)}
                      title="Quitar selección"
                    >✕</button>
                  </div>
                )}

                <button
                  className={`confirmar-btn-mapa${dirMapa ? ' confirmar-btn-mapa--secundario' : ''}`}
                  onClick={() => setMapaAbierto(true)}
                >
                  {dirMapa ? '✏️ Cambiar ubicación en mapa' : '📍 Abrir mapa para seleccionar'}
                </button>
              </div>

              {/* Separador */}
              <div className="confirmar-dir-separador">
                <span>o ingresá la dirección manualmente</span>
              </div>

              {/* Opción manual */}
              <div className={`confirmar-dir-seccion${dirMapa ? ' confirmar-dir-seccion--desactivada' : ''}`}>
                {dirMapa && (
                  <div className="confirmar-dir-seccion-nota">
                    Quitá la selección del mapa para usar esta opción.
                  </div>
                )}

                <div className="confirmar-dir-campos">

                  {/* Fila 1: Departamento + Ciudad */}
                  <div className="confirmar-dir-fila">
                    <div className="confirmar-dir-campo">
                      <label className="confirmar-label">
                        Departamento <span className="confirmar-requerido">*</span>
                      </label>
                      <select
                        className="confirmar-input confirmar-select"
                        value={departamento}
                        onChange={e => setDepartamento(e.target.value)}
                        disabled={Boolean(dirMapa)}
                      >
                        <option value="">Seleccioná un departamento</option>
                        {DEPARTAMENTOS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="confirmar-dir-campo">
                      <label className="confirmar-label">
                        Ciudad / Localidad <span className="confirmar-requerido">*</span>
                      </label>
                      <input
                        className="confirmar-input"
                        type="text"
                        placeholder="Ej: Montevideo"
                        value={ciudad}
                        onChange={e => setCiudad(e.target.value)}
                        disabled={Boolean(dirMapa)}
                      />
                    </div>
                  </div>

                  {/* Fila 2: Calle + Número */}
                  <div className="confirmar-dir-fila">
                    <div className="confirmar-dir-campo confirmar-dir-campo--amplio">
                      <label className="confirmar-label">
                        Calle <span className="confirmar-requerido">*</span>
                      </label>
                      <input
                        className="confirmar-input"
                        type="text"
                        placeholder="Ej: Av. 18 de Julio"
                        value={calle}
                        onChange={e => setCalle(e.target.value)}
                        disabled={Boolean(dirMapa)}
                      />
                    </div>
                    <div className="confirmar-dir-campo confirmar-dir-campo--angosto">
                      <label className="confirmar-label">
                        Número <span className="confirmar-requerido">*</span>
                      </label>
                      <input
                        className="confirmar-input"
                        type="text"
                        placeholder="Ej: 1234"
                        value={numero}
                        onChange={e => setNumero(e.target.value)}
                        disabled={Boolean(dirMapa)}
                      />
                    </div>
                  </div>

                  {/* Fila 3: Esquina + Apto */}
                  <div className="confirmar-dir-fila">
                    <div className="confirmar-dir-campo">
                      <label className="confirmar-label">Esquina / Entre calles</label>
                      <input
                        className="confirmar-input"
                        type="text"
                        placeholder="Ej: Ejido"
                        value={esquina}
                        onChange={e => setEsquina(e.target.value)}
                        disabled={Boolean(dirMapa)}
                      />
                    </div>
                    <div className="confirmar-dir-campo">
                      <label className="confirmar-label">Apartamento / Piso / Oficina</label>
                      <input
                        className="confirmar-input"
                        type="text"
                        placeholder="Ej: Apto 3B"
                        value={apto}
                        onChange={e => setApto(e.target.value)}
                        disabled={Boolean(dirMapa)}
                      />
                    </div>
                  </div>

                </div>

                <div className="confirmar-input-ayuda">
                  * Campos obligatorios para la opción manual.
                </div>
              </div>

              {error && <div className="confirmar-error">{error}</div>}
            </div>

          </div>

          {/* Panel derecho */}
          <div className="confirmar-derecha">
            <div className="confirmar-card confirmar-card-accion">
              <div className="confirmar-card-titulo">Tu pedido generará</div>
              <div className="confirmar-accion-desc">
                Se crearán{' '}
                <strong>
                  {Object.keys(porDistribuidor).length} sub-pedido
                  {Object.keys(porDistribuidor).length !== 1 ? 's' : ''} independiente
                  {Object.keys(porDistribuidor).length !== 1 ? 's' : ''}
                </strong>
                , uno por cada distribuidor. Cada uno quedará en estado <strong>Pendiente</strong>.
              </div>
              <button
                className="confirmar-btn"
                onClick={handleConfirmar}
                disabled={enviando || !puedeConfirmar}
              >
                {enviando ? 'Confirmando...' : 'Confirmar pedido'}
              </button>
              <div className="confirmar-btn-volver" onClick={() => navigate('/carrito')}>
                ← Volver al carrito
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer mobile */}
      <div className="confirmar-mobile-footer">
        <div className="confirmar-mobile-footer-info">
          Se crearán {Object.keys(porDistribuidor).length} sub-pedido
          {Object.keys(porDistribuidor).length !== 1 ? 's' : ''}
        </div>
        <button
          className="confirmar-btn"
          onClick={handleConfirmar}
          disabled={enviando || !puedeConfirmar}
        >
          {enviando ? 'Confirmando...' : 'Confirmar pedido'}
        </button>
        {error && <div className="confirmar-error confirmar-error-mobile">{error}</div>}
      </div>

    </div>
  )
}

export default ConfirmacionPedido
