import { useState } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { rutaInicio } from '../../lib/auth'
import { useCarrito } from '../../context/CarritoContext'
import { precioAplicable } from '../../lib/precios'
import ModalMapaDireccion from '../../components/ModalMapaDireccion'
import Hdr from '../../components/Hdr'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Tarjeta from '../../components/ui/Tarjeta'
import EstadoLista from '../../components/ui/EstadoLista'
import './ConfirmacionPedido.css'
import Marca from '../../components/Marca'

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

function paramsNominatim({ calle, numero, ciudad, departamento }) {
  const params = new URLSearchParams({
    format: 'json',
    street: `${calle.trim()} ${numero.trim()}`,
    country: 'Uruguay',
    'accept-language': 'es',
    addressdetails: '1',
    limit: '1',
  })
  if (ciudad.trim()) params.set('city', ciudad.trim())
  if (departamento) params.set('state', departamento)
  return params
}

async function geocodificarDireccion(campos) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${paramsNominatim(campos)}`, { headers: { 'User-Agent': 'TesisCEI-Marketplace/1.0' } })
    if (res.ok) {
      const data = await res.json()
      if (data.length) return { lat: Number(data[0].lat), lng: Number(data[0].lon) }
    }
  } catch {
    return null
  }

  if (!campos.departamento) return null

  await new Promise(r => setTimeout(r, 1100))

  try {
    const paramsSinDepto = paramsNominatim({ ...campos, departamento: '' })
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${paramsSinDepto}`, { headers: { 'User-Agent': 'TesisCEI-Marketplace/1.0' } })
    if (!res.ok) return null
    const data = await res.json()
    const detectado = data[0]?.address?.state
    if (detectado && detectado !== campos.departamento) {
      return { departamentoSugerido: detectado }
    }
    return null
  } catch {
    return null
  }
}

function ConfirmacionPedido() {
  const navigate = useNavigate()
  const { items, vaciar, totalItems } = useCarrito()

  const [dirMapa, setDirMapa] = useState(null)
  const [mapaAbierto, setMapaAbierto] = useState(false)

  const [mostrarManual, setMostrarManual] = useState(false)
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

  const totalEstimado = items.reduce((acc, i) => acc + (precioAplicable(i.tarifas, i.cantidad) || 0) * i.cantidad, 0)

  const camposManualCompletos = departamento && ciudad.trim() && calle.trim() && numero.trim()

  const handleDepartamentoChange = (valor) => {
    setDepartamento(valor)
    if (valor === 'Montevideo' && !ciudad.trim()) {
      setCiudad('Montevideo')
    }
  }

  const getDireccionFinal = () => {
    if (dirMapa) return dirMapa.direccion
    if (camposManualCompletos) return componer({ calle, numero, esquina, apto, ciudad, departamento })
    return ''
  }

  const handleUbicacionConfirmada = ({ lat, lng, direccion }) => {
    setDirMapa({ lat, lng, direccion })
    setMapaAbierto(false)
    setMostrarManual(false)
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
      let latitud = dirMapa?.lat ?? null
      let longitud = dirMapa?.lng ?? null
      if (!dirMapa) {
        const geocodificada = await geocodificarDireccion({ calle, numero, ciudad, departamento })
        if (geocodificada?.departamentoSugerido) {
          setError(`La calle ingresada parece estar en ${geocodificada.departamentoSugerido}, no en ${departamento}. Verificá el departamento seleccionado antes de confirmar.`)
          setEnviando(false)
          return
        }
        if (!geocodificada || !Number.isFinite(geocodificada.lat) || !Number.isFinite(geocodificada.lng)) {
          setError('No pudimos ubicar la dirección ingresada. Revisá los datos o seleccioná el punto en el mapa.')
          setEnviando(false)
          return
        }
        latitud = geocodificada.lat
        longitud = geocodificada.lng
      }
      const payload = {
        direccionEntrega: direccionFinal,
        latitud,
        longitud,
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
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const puedeConfirmar = Boolean(getDireccionFinal())

  if (pedidosConfirmados) {
    return (
      <div className="confirmar-pagina">
        <Hdr logo={<span className="hdr-logo" onClick={() => navigate(rutaInicio())}><Marca /></span>}>
          <span className="titulo1">Pedido confirmado</span>
        </Hdr>
        <div className="confirmar-contenido">
          <EstadoLista variante="exito" className="col gap-s confirmar-exito" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 36 }}>✓</span>
            <span className="texto" style={{ fontWeight: 700 }}>¡Pedido confirmado!</span>
            <span>
              Se generaron {pedidosConfirmados.length} sub-pedido{pedidosConfirmados.length !== 1 ? 's' : ''} independiente{pedidosConfirmados.length !== 1 ? 's' : ''}.
            </span>
            <div className="confirmar-exito-lista">
              {pedidosConfirmados.map((p, i) => (
                <div key={p.pedidoId} className="confirmar-exito-item">
                  <span className="confirmar-exito-label">Sub-pedido {i + 1}</span>
                  <span className="confirmar-exito-num">#{p.pedidoId}</span>
                </div>
              ))}
            </div>
            <Boton onClick={() => navigate(rutaInicio())}>
              Volver al catálogo
            </Boton>
          </EstadoLista>
        </div>
      </div>
    )
  }

  if (totalItems === 0) {
    return (
      <div className="confirmar-pagina">
        <Hdr logo={<span className="hdr-logo" onClick={() => navigate(rutaInicio())}><Marca /></span>}>
          <span className="titulo1">Confirmar pedido</span>
        </Hdr>
        <div className="confirmar-contenido">
          <EstadoLista>El carrito está vacío. No hay pedido para confirmar.</EstadoLista>
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

      <Hdr logo={<span className="hdr-logo" onClick={() => navigate(rutaInicio())}><Marca /></span>}>
        <span className="titulo1">Confirmar pedido</span>
        <button type="button" className="link" onClick={() => navigate('/carrito')}>← Volver al carrito</button>
      </Hdr>

      <div className="confirmar-contenido">
        <div className="confirmar-descripcion">
          Revisá el resumen antes de confirmar. Una vez confirmado, no podrás modificar el pedido.
        </div>

        <div className="confirmar-layout">

          <div className="confirmar-izquierda">

            <Tarjeta className="col gap-s">
              <div className="titulo1">Resumen del pedido</div>
              {Object.entries(porDistribuidor).map(([distId, grupo]) => {
                const subtotal = grupo.items.reduce((acc, i) => acc + (precioAplicable(i.tarifas, i.cantidad) || 0) * i.cantidad, 0)
                return (
                  <div key={distId} className="confirmar-resumen-grupo">
                    <div className="texto-mudo">{grupo.nombreDistribuidor}</div>
                    {grupo.items.map(item => (
                      <div key={item.id} className="fila confirmar-resumen-fila" style={{ justifyContent: 'space-between' }}>
                        <span className="texto">{item.nombre} × {item.cantidad}</span>
                        <span className="texto">${((precioAplicable(item.tarifas, item.cantidad) || 0) * item.cantidad).toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                    <div className="fila confirmar-resumen-subtotal" style={{ justifyContent: 'space-between' }}>
                      <span>Subtotal</span>
                      <span>${subtotal.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                )
              })}
              <hr className="separador" />
              <div className="fila" style={{ justifyContent: 'space-between' }}>
                <span className="texto">Total estimado</span>
                <span className="texto">${totalEstimado.toLocaleString('es-AR')}</span>
              </div>
            </Tarjeta>

            <Tarjeta className="col gap-m">
              <div className="titulo1">Dirección de entrega</div>

              <div className="col gap-s confirmar-dir-seccion">
                <div className="titulo1">Seleccionar en el mapa</div>
                <p className="texto-mudo" style={{ margin: 0 }}>
                  Indicá el punto exacto de entrega arrastrando el pin.
                </p>

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

                <Boton variante="outline" onClick={() => setMapaAbierto(true)}>
                  {dirMapa ? '✏️ Cambiar ubicación en mapa' : '📍 Abrir mapa para seleccionar'}
                </Boton>

                {!dirMapa && !mostrarManual && (
                  <button type="button" className="link confirmar-dir-fallback-link" onClick={() => setMostrarManual(true)}>
                    ¿No podés usar el mapa? Completá la dirección manualmente
                  </button>
                )}
              </div>

              {!dirMapa && mostrarManual && (
              <div className="col gap-s confirmar-dir-seccion">
                <button type="button" className="link confirmar-dir-fallback-link" onClick={() => setMostrarManual(false)}>
                  ← Usar el mapa en su lugar
                </button>

                <div className="confirmar-dir-campos">

                  <div className="fila gap-m confirmar-dir-fila">
                    <div className="col gap-s flex1 confirmar-dir-campo">
                      <span className="texto">
                        Departamento <span className="confirmar-requerido">*</span>
                      </span>
                      <Campo
                        as="select"
                        value={departamento}
                        onChange={e => handleDepartamentoChange(e.target.value)}
                      >
                        <option value="">Seleccioná un departamento</option>
                        {DEPARTAMENTOS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Campo>
                    </div>
                    <div className="col gap-s flex1 confirmar-dir-campo">
                      <span className="texto">
                        Ciudad / Localidad <span className="confirmar-requerido">*</span>
                      </span>
                      <Campo
                        type="text"
                        placeholder="Ej: Montevideo"
                        value={ciudad}
                        onChange={e => setCiudad(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="fila gap-m confirmar-dir-fila">
                    <div className="col gap-s confirmar-dir-campo confirmar-dir-campo--amplio">
                      <span className="texto">
                        Calle <span className="confirmar-requerido">*</span>
                      </span>
                      <Campo
                        type="text"
                        placeholder="Ej: Av. 18 de Julio"
                        value={calle}
                        onChange={e => setCalle(e.target.value)}
                      />
                    </div>
                    <div className="col gap-s confirmar-dir-campo confirmar-dir-campo--angosto">
                      <span className="texto">
                        Número <span className="confirmar-requerido">*</span>
                      </span>
                      <Campo
                        type="text"
                        placeholder="Ej: 1234"
                        value={numero}
                        onChange={e => setNumero(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="fila gap-m confirmar-dir-fila">
                    <div className="col gap-s flex1 confirmar-dir-campo">
                      <span className="texto">Esquina / Entre calles</span>
                      <Campo
                        type="text"
                        placeholder="Ej: Ejido"
                        value={esquina}
                        onChange={e => setEsquina(e.target.value)}
                      />
                    </div>
                    <div className="col gap-s flex1 confirmar-dir-campo">
                      <span className="texto">Apartamento / Piso / Oficina</span>
                      <Campo
                        type="text"
                        placeholder="Ej: Apto 3B"
                        value={apto}
                        onChange={e => setApto(e.target.value)}
                      />
                    </div>
                  </div>

                </div>

                <div className="confirmar-input-ayuda">
                  * Campos obligatorios para la opción manual.
                </div>
              </div>
              )}

              {error && <div className="confirmar-error">{error}</div>}
            </Tarjeta>

          </div>

          <div className="confirmar-derecha">
            <Tarjeta className="col gap-s confirmar-card-accion">
              <div className="titulo1">Tu pedido generará</div>
              <p className="texto" style={{ margin: 0 }}>
                Se crearán{' '}
                <strong>
                  {Object.keys(porDistribuidor).length} sub-pedido
                  {Object.keys(porDistribuidor).length !== 1 ? 's' : ''} independiente
                  {Object.keys(porDistribuidor).length !== 1 ? 's' : ''}
                </strong>
                , uno por cada distribuidor. Cada uno quedará en estado <strong>Pendiente</strong>.
              </p>
              <Boton
                onClick={handleConfirmar}
                disabled={enviando || !puedeConfirmar}
              >
                {enviando ? 'Confirmando...' : 'Confirmar pedido'}
              </Boton>
              <button type="button" className="link confirmar-btn-volver" onClick={() => navigate('/carrito')}>
                ← Volver al carrito
              </button>
            </Tarjeta>
          </div>

        </div>
      </div>

      <div className="confirmar-mobile-footer">
        <div className="confirmar-mobile-footer-info">
          Se crearán {Object.keys(porDistribuidor).length} sub-pedido
          {Object.keys(porDistribuidor).length !== 1 ? 's' : ''}
        </div>
        <Boton
          onClick={handleConfirmar}
          disabled={enviando || !puedeConfirmar}
        >
          {enviando ? 'Confirmando...' : 'Confirmar pedido'}
        </Boton>
        {error && <div className="confirmar-error confirmar-error-mobile">{error}</div>}
      </div>

    </div>
  )
}

export default ConfirmacionPedido
