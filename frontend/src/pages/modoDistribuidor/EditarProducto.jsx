import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import TarjetaProductoPreview from '../../components/TarjetaProductoPreview'
import './FichaProducto.css'

const API = 'http://localhost:3000'

function EditarProducto() {
  const navigate = useNavigate()
  const { id } = useParams()
  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const [categorias, setCategorias] = useState([])
  const [nombre, setNombre] = useState('')
  const [incluyeCantidad, setIncluyeCantidad] = useState(false)
  const [cantidadNombre, setCantidadNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagenArchivo, setImagenArchivo] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [imagenUrlActual, setImagenUrlActual] = useState(null)
  const [categoriaId, setCategoriaId] = useState('')
  const [magnitudValor, setMagnitudValor] = useState('')
  const [magnitudUnidad, setMagnitudUnidad] = useState('')
  const [stockTotal, setStockTotal] = useState('')
  const [precioCosto, setPrecioCosto] = useState('')
  const [errorProducto, setErrorProducto] = useState('')
  const [cargandoProducto, setCargandoProducto] = useState(false)
  const [guardado, setGuardado] = useState(false)

  const [umbralMinimoStock, setUmbralMinimoStock] = useState('')
  const [errorUmbral, setErrorUmbral] = useState('')
  const [umbralGuardado, setUmbralGuardado] = useState(false)
  const [cargandoUmbral, setCargandoUmbral] = useState(false)

  const [precios, setPrecios] = useState([])
  const [mostrarFormPrecio, setMostrarFormPrecio] = useState(false)
  const [editandoPrecioId, setEditandoPrecioId] = useState(null)
  const [cantidadMinima, setCantidadMinima] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [descuentoPct, setDescuentoPct] = useState('')
  const [errorPrecio, setErrorPrecio] = useState('')
  const [cargandoPrecio, setCargandoPrecio] = useState(false)

  const [descuentoTotal, setDescuentoTotal] = useState('')
  const [cargandoDescuento, setCargandoDescuento] = useState(false)
  const [errorDescuento, setErrorDescuento] = useState('')

  // --- Nombre comercial propio, para la previsualización de la tarjeta ---
  const [nombreDistribuidor, setNombreDistribuidor] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/api/productos/categorias'),
      api.get(`/api/productos/${id}`),
      api.get(`/api/productos/${id}/precios`),
      api.post('/distribuidor/obtenerPerfilPropio'),
    ])
      .then(([catRes, prodRes, preciosRes, perfilRes]) => {
        setCategorias(catRes.data)
        const p = prodRes.data
        setNombre(p.nombre)
        setMarca(p.marca || '')
        setDescripcion(p.descripcion || '')
        setImagenUrlActual(p.imagenUrl)
        setCategoriaId(String(p.categoriaId))
        setMagnitudValor(p.magnitudValor ?? '')
        setMagnitudUnidad(p.magnitudUnidad || '')
        setStockTotal(p.stockTotal ?? '')
        setUmbralMinimoStock(p.umbralMinimoStock ?? '')
        setPrecios(preciosRes.data)
        const base = preciosRes.data.find(pv => Number(pv.cantidadMinima) === 1)
        setPrecioCosto(base?.precioCosto ?? '')
        setNombreDistribuidor(perfilRes.data.nombreComercial || '')
      })
      .catch(() => setErrorCarga('No se pudo cargar el producto.'))
      .finally(() => setCargandoInicial(false))
  }, [id])

  const convertirAWebP = (archivo) =>
    new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(archivo)
      img.onload = () => {
        const MAX = 900
        let ancho = img.width
        let alto = img.height
        if (ancho > MAX) {
          alto = Math.round((alto * MAX) / ancho)
          ancho = MAX
        }
        const canvas = document.createElement('canvas')
        canvas.width = ancho
        canvas.height = alto
        canvas.getContext('2d').drawImage(img, 0, 0, ancho, alto)
        URL.revokeObjectURL(url)
        canvas.toBlob(
          (blob) => resolve(new File([blob], 'imagen.webp', { type: 'image/webp' })),
          'image/webp',
          0.85
        )
      }
      img.src = url
    })

  const handleImagenChange = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    const convertido = await convertirAWebP(archivo)
    setImagenArchivo(convertido)
    setImagenPreview(URL.createObjectURL(convertido))
  }

  const handleGuardarProducto = async () => {
    setErrorProducto('')
    if (!marca.trim()) {
      setErrorProducto('La marca del producto es obligatoria.')
      return
    }
    setCargandoProducto(true)
    try {
      const formData = new FormData()
      formData.append('nombre', nombreEfectivo)
      formData.append('marca', marca)
      formData.append('descripcion', descripcion)
      formData.append('categoriaId', categoriaId)
      formData.append('magnitudValor', magnitudValor)
      formData.append('magnitudUnidad', magnitudUnidad)
      formData.append('stockTotal', stockTotal)
      formData.append('precioCosto', precioCosto)
      if (imagenArchivo) formData.append('imagen', imagenArchivo)

      await api.put(`/api/productos/${id}`, formData)
      setGuardado(true)
    } catch (err) {
      setErrorProducto(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCargandoProducto(false)
    }
  }

  // El tramo se carga como precio total para la cantidad mínima (más fácil
  // de pensar para packs/bultos); al servidor se envía el precio por unidad,
  // que es lo que el resto del sistema espera (RF-015).
  const handleAgregarPrecio = async () => {
    setErrorPrecio('')
    setCargandoPrecio(true)
    try {
      const precioPorUnidad = Number(precioVenta) / Number(cantidadMinima)
      const res = await api.post(
        `/api/productos/${id}/precios`,
        { cantidadMinima, precioVenta: precioPorUnidad }
      )
      setPrecios(prev => [...prev, res.data.precio])
      setCantidadMinima('')
      setPrecioVenta('')
      setDescuentoPct('')
      setMostrarFormPrecio(false)
    } catch (err) {
      setErrorPrecio(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCargandoPrecio(false)
    }
  }

  const handleEditarPrecio = async (precioId) => {
    setErrorPrecio('')
    setCargandoPrecio(true)
    try {
      const precioPorUnidad = Number(precioVenta) / Number(cantidadMinima)
      const res = await api.put(
        `/api/productos/${id}/precios/${precioId}`,
        { cantidadMinima, precioVenta: precioPorUnidad }
      )
      setPrecios(prev => prev.map(p => p.id === precioId ? res.data.precio : p))
      setEditandoPrecioId(null)
      setCantidadMinima('')
      setPrecioVenta('')
      setDescuentoPct('')
    } catch (err) {
      setErrorPrecio(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCargandoPrecio(false)
    }
  }

  // --- Vínculo bidireccional entre % de descuento y precio total del tramo,
  // ambos relativos al precio base (cantidad 1). Cambiar cualquiera de los
  // tres (cantidad, %, total) recalcula el que falte. ---
  const handleChangeCantidadMinima = (value) => {
    setCantidadMinima(value)
    const cant = Number(value)
    if (!precioBaseRef || !cant) return
    if (descuentoPct !== '') {
      const pct = Number(descuentoPct)
      const total = precioBaseRef * (1 - pct / 100) * cant
      setPrecioVenta(total.toFixed(2))
    } else if (precioVenta !== '') {
      const precioPorUnidad = Number(precioVenta) / cant
      const pct = precioBaseRef > 0 ? Math.round((1 - precioPorUnidad / precioBaseRef) * 100) : 0
      setDescuentoPct(String(pct))
    }
  }

  const handleChangeDescuentoPct = (value) => {
    setDescuentoPct(value)
    const cant = Number(cantidadMinima)
    if (value === '' || !precioBaseRef || !cant) return
    const pct = Number(value)
    const precioPorUnidad = precioBaseRef * (1 - pct / 100)
    setPrecioVenta((precioPorUnidad * cant).toFixed(2))
  }

  const handleChangePrecioVenta = (value) => {
    setPrecioVenta(value)
    const cant = Number(cantidadMinima)
    if (value === '' || !precioBaseRef || !cant) return
    const precioPorUnidad = Number(value) / cant
    const pct = precioBaseRef > 0 ? Math.round((1 - precioPorUnidad / precioBaseRef) * 100) : 0
    setDescuentoPct(String(pct))
  }

  const precioPorUnidadCalc = (cantidadMinima && precioVenta && Number(cantidadMinima) > 0)
    ? Number(precioVenta) / Number(cantidadMinima)
    : null

  const handleEliminarPrecio = async (precioId) => {
    try {
      const res = await api.delete(`/api/productos/${id}/precios/${precioId}`)
      if (res.data.tipoResultado === 'PRODUCTO_DESHABILITADO') {
        // El precio tenía pedidos asociados: no se borró, se deshabilitó
        // el producto entero para no romper el historial de esos pedidos.
        alert(res.data.mensaje)
        navigate('/inicio')
        return
      }
      setPrecios(prev => prev.filter(p => p.id !== precioId))
    } catch (err) {
      setErrorPrecio(err.response?.data?.error || 'No fue posible eliminar el precio.')
    }
  }

  const handleAplicarDescuento = async () => {
    setErrorDescuento('')
    setCargandoDescuento(true)
    try {
      const res = await api.post(
        `/api/productos/${id}/precios/descuento-total`,
        { porcentaje: Number(descuentoTotal) || 0 }
      )
      setPrecios(res.data.precios)
      setDescuentoTotal('')
    } catch (err) {
      setErrorDescuento(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCargandoDescuento(false)
    }
  }

  const handleGuardarUmbral = async () => {
    setErrorUmbral('')
    setUmbralGuardado(false)
    setCargandoUmbral(true)
    try {
      await api.patch(`/api/productos/${id}/umbral`, { valor: Number(umbralMinimoStock) })
      setUmbralGuardado(true)
    } catch (err) {
      setErrorUmbral(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCargandoUmbral(false)
    }
  }

  const iniciarEdicionPrecio = (p) => {
    setEditandoPrecioId(p.id)
    setCantidadMinima(p.cantidadMinima)
    const total = Number(p.precioVenta) * Number(p.cantidadMinima)
    setPrecioVenta(total.toFixed(2))
    const pct = precioBaseRef && precioBaseRef > 0
      ? Math.round((1 - Number(p.precioVenta) / precioBaseRef) * 100)
      : 0
    setDescuentoPct(String(pct))
    setMostrarFormPrecio(false)
    setErrorPrecio('')
  }

  const cancelarEdicionPrecio = () => {
    setEditandoPrecioId(null)
    setCantidadMinima('')
    setPrecioVenta('')
    setDescuentoPct('')
    setErrorPrecio('')
  }

  const precioBaseRef = (() => {
    const base = precios.find(p => Number(p.cantidadMinima) === 1)
    return base ? Number(base.precioVenta) : null
  })()

  // La cantidad (ej. "x6") es solo una ayuda para armar el nombre — no se
  // guarda como campo aparte, se agrega directamente al texto del nombre.
  const nombreEfectivo = incluyeCantidad && cantidadNombre
    ? `${nombre.trim()} x${cantidadNombre}`
    : nombre

  // --- Datos para la previsualización de la tarjeta del catálogo ---
  const categoriaNombre = categorias.find(c => String(c.id) === String(categoriaId))?.nombre
  const precioMinimoPreview = precios.length > 0
    ? Math.min(...precios.map(p => Number(p.precioVenta)))
    : 0
  const imagenSrcPreview = imagenPreview || (imagenUrlActual ? `${API}${imagenUrlActual}` : null)

  if (cargandoInicial) return <div className="ficha-fondo"><div className="ficha-contenedor">Cargando...</div></div>
  if (errorCarga) return <div className="ficha-fondo"><div className="ficha-contenedor ficha-error">{errorCarga}</div></div>

  return (
    <div className="ficha-fondo">
      <div className="ficha-mobile-header" data-tema="oscuro">
        <span className="ficha-mobile-volver" onClick={() => navigate('/inicio')}>←</span>
        <div className="ficha-mobile-titulo">Editar producto</div>
      </div>
      <div className="ficha-contenedor">

        <div className="ficha-breadcrumb">
          <span className="ficha-breadcrumb-link" onClick={() => navigate('/inicio')}>Mis productos</span>
          <span className="ficha-breadcrumb-sep">›</span>
          <span>Editar producto</span>
        </div>

        {guardado && (
          <div className="ficha-card ficha-card-ok" style={{ marginBottom: '1rem' }}>
            <span className="ficha-ok-icono">✓</span>
            <span className="ficha-ok-texto">Producto actualizado correctamente.</span>
          </div>
        )}

        <div className="ficha-layout">
          <div className="ficha-columna-principal">

            <div className="ficha-card">
              <div className="ficha-card-titulo">Datos del producto</div>

              <div className="ficha-fila-top">
                <div className="ficha-imagen-zona" onClick={() => document.getElementById('input-imagen').click()}>
                  {imagenPreview
                    ? <img src={imagenPreview} alt="preview" className="ficha-imagen-preview" />
                    : imagenUrlActual
                      ? <img src={`${API}${imagenUrlActual}`} alt="actual" className="ficha-imagen-preview" />
                      : <span className="ficha-imagen-texto">+ Subir foto</span>
                  }
                  <input
                    id="input-imagen"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImagenChange}
                  />
                </div>

                <div className="ficha-fila-derecha">
                  <div className="ficha-campo">
                    <div className="ficha-label-fila">
                      <label className="ficha-label">Nombre del producto <span className="ficha-requerido">*</span></label>
                      <div className="ficha-checkbox-fila">
                        <span className="ficha-checkbox-ayuda">activa si es un pack</span>
                        <label className="ficha-checkbox-label">
                          <input
                            type="checkbox"
                            checked={incluyeCantidad}
                            onChange={e => setIncluyeCantidad(e.target.checked)}
                          />
                          Pack
                        </label>
                      </div>
                    </div>
                    <div className="ficha-nombre-fila">
                      <input
                        type="text"
                        className="ficha-input"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        placeholder="Ej: Gaseosa"
                      />
                      {incluyeCantidad && (
                        <input
                          type="number"
                          className="ficha-input ficha-input-cantidad"
                          min="1"
                          step="1"
                          placeholder="Ej: 6"
                          value={cantidadNombre}
                          onChange={e => setCantidadNombre(e.target.value)}
                        />
                      )}
                    </div>
                    {incluyeCantidad && <span className="ficha-ayuda">Se agrega como "x{cantidadNombre || 'N'}" al nombre.</span>}
                  </div>

                  <div className="ficha-campo">
                    <label className="ficha-label">Marca <span className="ficha-requerido">*</span></label>
                    <input type="text" className="ficha-input" value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej: Coca Cola" />
                  </div>
                </div>
              </div>

              <div className="ficha-fila-dos">
                <div className="ficha-campo">
                  <label className="ficha-label">Contenido / Longitud <span className="ficha-ayuda-inline">opcional</span></label>
                  <div className="ficha-magnitud">
                    <input type="number" className="ficha-input" min="0" step="0.01" placeholder="Ej: 1.5" value={magnitudValor} onChange={e => setMagnitudValor(e.target.value)} />
                    <select className="ficha-select" value={magnitudUnidad} onChange={e => setMagnitudUnidad(e.target.value)}>
                      <option value="">—</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="l">L</option>
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                    </select>
                  </div>
                  <span className="ficha-ayuda">Solo arma el título. No afecta precio ni stock.</span>
                </div>

                <div className="ficha-campo">
                  <label className="ficha-label">Categoría <span className="ficha-requerido">*</span></label>
                  <select className="ficha-select" value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
                    <option value="">Seleccioná una categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ficha-campo">
                <label className="ficha-label">Descripción</label>
                <textarea className="ficha-textarea" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción del producto" />
              </div>

              <div className="ficha-fila-dos">
                <div className="ficha-campo">
                  <label className="ficha-label">Stock total <span className="ficha-requerido">*</span></label>
                  <input type="number" className="ficha-input ficha-input-angosto" min="0" value={stockTotal} onChange={e => setStockTotal(e.target.value)} placeholder="0" />
                  <span className="ficha-ayuda">No puede reducirse por debajo del stock reservado.</span>
                </div>
                <div className="ficha-campo">
                  <label className="ficha-label">Precio de costo <span className="ficha-ayuda-inline">opcional</span></label>
                  <input type="number" className="ficha-input ficha-input-angosto" min="0" step="0.01" placeholder="Opcional" value={precioCosto} onChange={e => setPrecioCosto(e.target.value)} />
                  <span className="ficha-ayuda">Lo que te cuesta a vos este producto.</span>
                </div>
              </div>

              {errorProducto && <div className="ficha-error">{errorProducto}</div>}
            </div>

            <div className="ficha-card">
              <div className="ficha-card-titulo">Alerta de stock bajo</div>
              <div className="ficha-campo">
                <label className="ficha-label">Umbral mínimo de stock</label>
                <input
                  type="number"
                  className="ficha-input ficha-input-angosto"
                  min="0"
                  value={umbralMinimoStock}
                  onChange={e => setUmbralMinimoStock(e.target.value)}
                  placeholder="0"
                />
                <span className="ficha-ayuda">
                  Recibirás una notificación cuando el stock disponible caiga por debajo de este valor.
                </span>
              </div>
              {errorUmbral && <div className="ficha-error">{errorUmbral}</div>}
              {umbralGuardado && <div className="ficha-ok-texto" style={{ fontSize: '13px', marginTop: '8px' }}>Umbral configurado correctamente.</div>}
              <div style={{ marginTop: '12px' }}>
                <button className="ficha-btn-guardar" onClick={handleGuardarUmbral} disabled={cargandoUmbral}>
                  {cargandoUmbral ? 'Guardando…' : 'Guardar umbral'}
                </button>
              </div>
            </div>

            {/* Precios por volumen */}
            <div className="ficha-card">
              <div className="ficha-precios-header">
                <div className="ficha-card-titulo">Precios por volumen</div>
                {!mostrarFormPrecio && editandoPrecioId === null && (
                  <button className="ficha-btn-agregar-precio" onClick={() => setMostrarFormPrecio(true)}>
                    + Agregar tramo
                  </button>
                )}
              </div>

              <div className="ficha-precios-tabla">
                <div className="ficha-precios-thead">
                  <div>Cantidad</div>
                  <div>Precio total</div>
                  <div>Precio por unidad</div>
                  <div></div>
                </div>

                {precios.length === 0 && !mostrarFormPrecio && (
                  <div className="ficha-precios-vacio">Sin precios registrados.</div>
                )}

                {precios.map(p => {
                  const precioPorUnidad = Number(p.precioVenta)
                  const total = precioPorUnidad * Number(p.cantidadMinima)
                  const desc = precioBaseRef && precioPorUnidad < precioBaseRef
                    ? Math.round((1 - precioPorUnidad / precioBaseRef) * 100)
                    : 0
                  return (
                    <div key={p.id}>
                      {editandoPrecioId === p.id ? (
                        <div className="ficha-form-precio">
                          <div className="ficha-fila-tres">
                            <div className="ficha-campo">
                              <label className="ficha-label">Cantidad (desde) <span className="ficha-requerido">*</span></label>
                              <input type="number" className="ficha-input" min="1" step="1" value={cantidadMinima} onChange={e => handleChangeCantidadMinima(e.target.value)} />
                            </div>
                            <div className="ficha-campo">
                              <label className="ficha-label">Descuento %</label>
                              <input type="number" className="ficha-input" min="0" max="99" step="1" placeholder="Ej: 12" value={descuentoPct} onChange={e => handleChangeDescuentoPct(e.target.value)} />
                            </div>
                            <div className="ficha-campo">
                              <label className="ficha-label">Precio total <span className="ficha-requerido">*</span></label>
                              <input type="number" className="ficha-input" min="0.01" step="0.01" value={precioVenta} onChange={e => handleChangePrecioVenta(e.target.value)} />
                            </div>
                          </div>
                          <div className="ficha-campo">
                            <label className="ficha-label">Precio por unidad</label>
                            <input type="text" className="ficha-input ficha-input-solo-lectura ficha-input-angosto" readOnly value={precioPorUnidadCalc != null ? `$${precioPorUnidadCalc.toFixed(2)}` : '—'} />
                          </div>
                          {errorPrecio && <div className="ficha-error">{errorPrecio}</div>}
                          <div className="ficha-form-precio-acciones">
                            <button className="ficha-btn-guardar" onClick={() => handleEditarPrecio(p.id)} disabled={cargandoPrecio}>
                              {cargandoPrecio ? 'Guardando…' : 'Guardar cambios'}
                            </button>
                            <button className="ficha-btn-cancelar" onClick={cancelarEdicionPrecio} disabled={cargandoPrecio}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="ficha-precios-fila">
                          <div><span className="ficha-cant-mas">+</span>{p.cantidadMinima} u.</div>
                          <div>${total.toFixed(2)}</div>
                          <div>
                            ${precioPorUnidad.toFixed(2)}
                            {desc > 0 && <span className="ficha-tramo-desc">−{desc}%</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className="ficha-precio-eliminar" style={{ cursor: 'pointer' }} onClick={() => iniciarEdicionPrecio(p)}>✎</span>
                            {Number(p.cantidadMinima) !== 1 && (
                              <span className="ficha-precio-eliminar" onClick={() => handleEliminarPrecio(p.id)}>✕</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {mostrarFormPrecio && (
                <div className="ficha-form-precio">
                  <div className="ficha-fila-tres">
                    <div className="ficha-campo">
                      <label className="ficha-label">Cantidad (desde) <span className="ficha-requerido">*</span></label>
                      <input type="number" className="ficha-input" min="1" step="1" placeholder="Ej: 10" value={cantidadMinima} onChange={e => handleChangeCantidadMinima(e.target.value)} />
                    </div>
                    <div className="ficha-campo">
                      <label className="ficha-label">Descuento %</label>
                      <input type="number" className="ficha-input" min="0" max="99" step="1" placeholder="Ej: 12" value={descuentoPct} onChange={e => handleChangeDescuentoPct(e.target.value)} />
                      <span className="ficha-ayuda">Sobre el precio base.</span>
                    </div>
                    <div className="ficha-campo">
                      <label className="ficha-label">Precio total <span className="ficha-requerido">*</span></label>
                      <input type="number" className="ficha-input" min="0.01" step="0.01" placeholder="Ej: 8100.00" value={precioVenta} onChange={e => handleChangePrecioVenta(e.target.value)} />
                    </div>
                  </div>
                  <div className="ficha-campo">
                    <label className="ficha-label">Precio por unidad</label>
                    <input type="text" className="ficha-input ficha-input-solo-lectura ficha-input-angosto" readOnly value={precioPorUnidadCalc != null ? `$${precioPorUnidadCalc.toFixed(2)}` : '—'} />
                  </div>
                  {errorPrecio && <div className="ficha-error">{errorPrecio}</div>}
                  <div className="ficha-form-precio-acciones">
                    <button className="ficha-btn-guardar" onClick={handleAgregarPrecio} disabled={cargandoPrecio}>
                      {cargandoPrecio ? 'Guardando…' : 'Guardar tramo'}
                    </button>
                    <button className="ficha-btn-cancelar" onClick={() => { setMostrarFormPrecio(false); setErrorPrecio(''); setDescuentoPct('') }} disabled={cargandoPrecio}>Cancelar</button>
                  </div>
                </div>
              )}

              <div className="ficha-precios-nota">
                Para publicar el producto necesitás al menos un precio por volumen.
              </div>
            </div>

            {/* Descuento total */}
            <div className="ficha-card">
              <div className="ficha-card-titulo">Descuento total</div>
              <div className="ficha-descuento-fila">
                <input
                  type="number"
                  className="ficha-input ficha-input-angosto"
                  min="0"
                  max="99"
                  placeholder="0"
                  value={descuentoTotal}
                  onChange={e => setDescuentoTotal(e.target.value)}
                />
                <span className="ficha-ayuda-inline">% sobre todos los precios</span>
                <button className="ficha-btn-guardar" onClick={handleAplicarDescuento} disabled={cargandoDescuento}>
                  {cargandoDescuento ? 'Aplicando…' : 'Aplicar'}
                </button>
              </div>
              {errorDescuento && <div className="ficha-error">{errorDescuento}</div>}
              <span className="ficha-ayuda">Al aplicar, baja ese porcentaje en todos los precios por volumen de una vez.</span>
            </div>

          </div>

          <div className="ficha-sidebar">
            <div className="ficha-card">
              <button className="ficha-btn-guardar" onClick={handleGuardarProducto} disabled={cargandoProducto}>
                {cargandoProducto ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button className="ficha-btn-cancelar" onClick={() => navigate('/inicio')} disabled={cargandoProducto}>
                Cancelar
              </button>
            </div>

            <div className="ficha-preview-bloque">
              <div className="ficha-sidebar-titulo">Así se ve en el catálogo</div>
              <TarjetaProductoPreview
                nombre={nombreEfectivo}
                marca={marca}
                magnitudValor={magnitudValor}
                magnitudUnidad={magnitudUnidad}
                categoriaNombre={categoriaNombre}
                descripcion={descripcion}
                imagenSrc={imagenSrcPreview}
                nombreDistribuidor={nombreDistribuidor}
                precioMinimo={precioMinimoPreview}
                precioBase={precioBaseRef}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default EditarProducto
