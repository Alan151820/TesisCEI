import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import TarjetaProductoPreview from '../../components/TarjetaProductoPreview'
import './FichaProducto.css'

function FichaProducto() {
  const navigate = useNavigate()
  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  // --- Estado del producto ---
  const [categorias, setCategorias] = useState([])
  const [nombre, setNombre] = useState('')
  const [incluyeCantidad, setIncluyeCantidad] = useState(false)
  const [cantidadNombre, setCantidadNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagenArchivo, setImagenArchivo] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [categoriaId, setCategoriaId] = useState('')
  const [magnitudValor, setMagnitudValor] = useState('')
  const [magnitudUnidad, setMagnitudUnidad] = useState('')
  const [precioBase, setPrecioBase] = useState('')
  const [precioCosto, setPrecioCosto] = useState('')
  const [stockInicial, setStockInicial] = useState('')
  const [errorProducto, setErrorProducto] = useState('')
  const [cargandoProducto, setCargandoProducto] = useState(false)

  // --- Precios por volumen: tramos adicionales, solo en memoria hasta
  // guardar el producto. Se crean todos juntos en el mismo POST. ---
  const [tramosAdicionales, setTramosAdicionales] = useState([])
  const [mostrarFormPrecio, setMostrarFormPrecio] = useState(false)
  const [cantidadMinima, setCantidadMinima] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [descuentoPct, setDescuentoPct] = useState('')
  const [errorPrecio, setErrorPrecio] = useState('')

  // --- Descuento total: se aplica localmente sobre el precio base y los
  // tramos adicionales todavía no guardados. ---
  const [descuentoTotal, setDescuentoTotal] = useState('')
  const [errorDescuento, setErrorDescuento] = useState('')

  // --- Nombre comercial propio, para la previsualización de la tarjeta ---
  const [nombreDistribuidor, setNombreDistribuidor] = useState('')

  useEffect(() => {
    api.get('/api/productos/categorias')
      .then(res => setCategorias(res.data))
      .catch(() => setErrorProducto('No se pudieron cargar las categorías.'))
    api.post('/distribuidor/obtenerPerfilPropio')
      .then(res => setNombreDistribuidor(res.data.nombreComercial || ''))
      .catch(() => {})
  }, [])

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

  // El tramo se carga como precio total para la cantidad mínima (más fácil
  // de pensar para packs/bultos); internamente se guarda como precio por
  // unidad, que es lo que el resto del sistema espera (RF-015).
  const handleAgregarPrecio = () => {
    setErrorPrecio('')
    const cant = Number(cantidadMinima)
    const total = Number(precioVenta)

    if (!total || total <= 0) {
      setErrorPrecio('El precio total debe ser mayor a cero.')
      return
    }
    if (!cant || cant <= 0) {
      setErrorPrecio('La cantidad mínima debe ser mayor a cero.')
      return
    }
    if (cant === 1 || tramosAdicionales.some(t => Number(t.cantidadMinima) === cant)) {
      setErrorPrecio('Ya existe un precio con esa cantidad mínima.')
      return
    }

    const precioPorUnidad = total / cant
    setTramosAdicionales(prev => [...prev, { idLocal: Date.now(), cantidadMinima: cant, precioVenta: precioPorUnidad, precioCosto: null }])
    setCantidadMinima('')
    setPrecioVenta('')
    setDescuentoPct('')
    setMostrarFormPrecio(false)
  }

  const handleEliminarPrecio = (idLocal) => {
    setTramosAdicionales(prev => prev.filter(t => t.idLocal !== idLocal))
  }

  // --- Vínculo bidireccional entre % de descuento y precio total del tramo,
  // ambos relativos al precio base (cantidad 1). Cambiar cualquiera de los
  // tres (cantidad, %, total) recalcula el que falte. ---
  const handleChangeCantidadMinima = (value) => {
    setCantidadMinima(value)
    const cant = Number(value)
    if (!precioBase || !cant) return
    if (descuentoPct !== '') {
      const pct = Number(descuentoPct)
      const total = Number(precioBase) * (1 - pct / 100) * cant
      setPrecioVenta(total.toFixed(2))
    } else if (precioVenta !== '') {
      const precioPorUnidad = Number(precioVenta) / cant
      const pct = Number(precioBase) > 0 ? Math.round((1 - precioPorUnidad / Number(precioBase)) * 100) : 0
      setDescuentoPct(String(pct))
    }
  }

  const handleChangeDescuentoPct = (value) => {
    setDescuentoPct(value)
    const cant = Number(cantidadMinima)
    if (value === '' || !precioBase || !cant) return
    const pct = Number(value)
    const precioPorUnidad = Number(precioBase) * (1 - pct / 100)
    setPrecioVenta((precioPorUnidad * cant).toFixed(2))
  }

  const handleChangePrecioVenta = (value) => {
    setPrecioVenta(value)
    const cant = Number(cantidadMinima)
    if (value === '' || !precioBase || !cant) return
    const precioPorUnidad = Number(value) / cant
    const pct = Number(precioBase) > 0 ? Math.round((1 - precioPorUnidad / Number(precioBase)) * 100) : 0
    setDescuentoPct(String(pct))
  }

  const precioPorUnidadCalc = (cantidadMinima && precioVenta && Number(cantidadMinima) > 0)
    ? Number(precioVenta) / Number(cantidadMinima)
    : null

  // RF-015: se aplica al guardar (nunca en vivo mientras se escribe), y
  // transforma los precios ya cargados en la pantalla — igual que antes,
  // solo que ahora esos precios todavía viven en el navegador, no en el
  // servidor.
  const handleAplicarDescuento = () => {
    setErrorDescuento('')
    const porcentaje = Number(descuentoTotal)
    if (!porcentaje || porcentaje <= 0) return
    if (porcentaje >= 100) {
      setErrorDescuento('El descuento total debe ser menor a 100%.')
      return
    }
    const factor = 1 - porcentaje / 100
    if (precioBase) setPrecioBase(prev => (Number(prev) * factor).toFixed(2))
    setTramosAdicionales(prev => prev.map(t => ({ ...t, precioVenta: Number((Number(t.precioVenta) * factor).toFixed(2)) })))
    setDescuentoTotal('')
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
      formData.append('precioBase', precioBase)
      formData.append('precioCosto', precioCosto)
      formData.append('stockInicial', stockInicial || 0)
      formData.append('preciosAdicionales', JSON.stringify(
        tramosAdicionales.map(t => ({ cantidadMinima: t.cantidadMinima, precioVenta: t.precioVenta, precioCosto: t.precioCosto }))
      ))
      if (imagenArchivo) formData.append('imagen', imagenArchivo)

      await api.post('/api/productos', formData)
      navigate('/inicio')
    } catch (err) {
      setErrorProducto(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCargandoProducto(false)
    }
  }

  // Vista previa unificada: precio base (fila fija, cantidad 1) + tramos
  // adicionales cargados hasta ahora, ordenados por cantidad mínima.
  const preciosPreview = [
    ...(precioBase ? [{ idLocal: 'base', cantidadMinima: 1, precioVenta: Number(precioBase), precioCosto: null, esBase: true }] : []),
    ...tramosAdicionales,
  ].sort((a, b) => Number(a.cantidadMinima) - Number(b.cantidadMinima))

  const precioBaseRef = precioBase ? Number(precioBase) : null

  // La cantidad (ej. "x6") es solo una ayuda para armar el nombre — no se
  // guarda como campo aparte, se agrega directamente al texto del nombre.
  const nombreEfectivo = incluyeCantidad && cantidadNombre
    ? `${nombre.trim()} x${cantidadNombre}`
    : nombre

  // --- Datos para la previsualización de la tarjeta del catálogo ---
  const categoriaNombre = categorias.find(c => String(c.id) === String(categoriaId))?.nombre
  const precioMinimoPreview = preciosPreview.length > 0
    ? Math.min(...preciosPreview.map(p => Number(p.precioVenta)))
    : 0

  return (
    <div className="ficha-fondo">
      <div className="ficha-mobile-header" data-tema="oscuro">
        <span className="ficha-mobile-volver" onClick={() => navigate('/inicio')}>←</span>
        <div className="ficha-mobile-titulo">Nuevo producto</div>
      </div>
      <div className="ficha-contenedor">

        <div className="ficha-breadcrumb">
          <span className="ficha-breadcrumb-link" onClick={() => navigate('/inicio')}>Mis productos</span>
          <span className="ficha-breadcrumb-sep">›</span>
          <span>Nuevo producto</span>
        </div>

        <div className="ficha-layout">
          <div className="ficha-columna-principal">

            <div className="ficha-card">
              <div className="ficha-card-titulo">Datos del producto</div>

              <div className="ficha-info-box">
                <div className="ficha-info-opcion">
                  <span className="ficha-info-icono">🧩</span>
                  <span>
                    <strong>¿Vendés por unidad y también en pack?</strong> Cargá la foto y los datos del producto individual, y agregá el precio de cada pack como un tramo más en "Precios por volumen" (por ejemplo, un pack de 6 unidades es un tramo con cantidad mínima 6). El stock se maneja en unidades individuales.
                  </span>
                </div>
                <div className="ficha-info-opcion">
                  <span className="ficha-info-icono">📦</span>
                  <span>
                    <strong>¿Vendés solo en packs cerrados?</strong> Indicá en el nombre cuántas unidades trae cada pack (por ejemplo, "Refresco x6 - Coca Cola"). El stock se maneja en packs.
                  </span>
                </div>
              </div>

              <div className="ficha-fila-top">
                <div className="ficha-imagen-zona" onClick={() => document.getElementById('input-imagen').click()}>
                  {imagenPreview
                    ? <img src={imagenPreview} alt="preview" className="ficha-imagen-preview" />
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
                    <input
                      type="text"
                      className="ficha-input"
                      value={marca}
                      onChange={e => setMarca(e.target.value)}
                      placeholder="Ej: Coca Cola"
                    />
                  </div>
                </div>
              </div>

              <div className="ficha-fila-dos">
                <div className="ficha-campo">
                  <label className="ficha-label">Contenido / Longitud <span className="ficha-ayuda-inline">opcional</span></label>
                  <div className="ficha-magnitud">
                    <input
                      type="number"
                      className="ficha-input"
                      min="0"
                      step="0.01"
                      placeholder="Ej: 1.5"
                      value={magnitudValor}
                      onChange={e => setMagnitudValor(e.target.value)}
                    />
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

              <div className="ficha-campo">
                <label className="ficha-label">Precio <span className="ficha-requerido">*</span></label>
                <input
                  type="number"
                  className="ficha-input"
                  min="0.01"
                  step="0.01"
                  placeholder="Ej: 9000"
                  value={precioBase}
                  onChange={e => setPrecioBase(e.target.value)}
                />
              </div>

              <div className="ficha-fila-dos">
                <div className="ficha-campo">
                  <label className="ficha-label">Stock inicial <span className="ficha-requerido">*</span></label>
                  <input type="number" className="ficha-input ficha-input-angosto" min="0" value={stockInicial} onChange={e => setStockInicial(e.target.value)} placeholder="0" />
                  <span className="ficha-ayuda">Cantidad de este producto que tenés disponible para vender.</span>
                </div>
                <div className="ficha-campo">
                  <label className="ficha-label">Precio de costo <span className="ficha-ayuda-inline">opcional</span></label>
                  <input type="number" className="ficha-input ficha-input-angosto" min="0" step="0.01" placeholder="Opcional" value={precioCosto} onChange={e => setPrecioCosto(e.target.value)} />
                  <span className="ficha-ayuda">Lo que te cuesta a vos este producto.</span>
                </div>
              </div>
            </div>

            {/* Sección precios por volumen */}
            <div className="ficha-card">
              <div className="ficha-precios-header">
                <div className="ficha-card-titulo">Precios por volumen</div>
                {!mostrarFormPrecio && (
                  <button className="ficha-btn-agregar-precio" onClick={() => setMostrarFormPrecio(true)}>
                    + Agregar tramo
                  </button>
                )}
              </div>

              {/* Tabla de precios (vista previa, todavía no guardada) */}
              {preciosPreview.length > 0 && (
                <div className="ficha-precios-tabla">
                  <div className="ficha-precios-thead">
                    <div>Cantidad</div>
                    <div>Precio total</div>
                    <div>Precio por unidad</div>
                    <div></div>
                  </div>

                  {preciosPreview.map(p => {
                    const precioPorUnidad = Number(p.precioVenta)
                    const total = precioPorUnidad * Number(p.cantidadMinima)
                    const desc = precioBaseRef && precioPorUnidad < precioBaseRef
                      ? Math.round((1 - precioPorUnidad / precioBaseRef) * 100)
                      : 0
                    return (
                      <div key={p.idLocal} className="ficha-precios-fila">
                        <div><span className="ficha-cant-mas">+</span>{p.cantidadMinima} u.</div>
                        <div>${total.toFixed(2)}</div>
                        <div>
                          ${precioPorUnidad.toFixed(2)}
                          {desc > 0 && <span className="ficha-tramo-desc">−{desc}%</span>}
                        </div>
                        <div>
                          {!p.esBase && (
                            <span className="ficha-precio-eliminar" onClick={() => handleEliminarPrecio(p.idLocal)}>✕</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Formulario inline para agregar precio */}
              {mostrarFormPrecio && (
                <div className="ficha-form-precio">
                  <div className="ficha-fila-tres">
                    <div className="ficha-campo">
                      <label className="ficha-label">Cantidad (desde) <span className="ficha-requerido">*</span></label>
                      <input
                        type="number"
                        className="ficha-input"
                        min="1"
                        step="1"
                        placeholder="Ej: 10"
                        value={cantidadMinima}
                        onChange={e => handleChangeCantidadMinima(e.target.value)}
                      />
                      <span className="ficha-ayuda">Aplica a partir de esa cantidad de unidades.</span>
                    </div>
                    <div className="ficha-campo">
                      <label className="ficha-label">Descuento %</label>
                      <input
                        type="number"
                        className="ficha-input"
                        min="0"
                        max="99"
                        step="1"
                        placeholder="Ej: 12"
                        value={descuentoPct}
                        onChange={e => handleChangeDescuentoPct(e.target.value)}
                      />
                      <span className="ficha-ayuda">Sobre el precio base.</span>
                    </div>
                    <div className="ficha-campo">
                      <label className="ficha-label">Precio total <span className="ficha-requerido">*</span></label>
                      <input
                        type="number"
                        className="ficha-input"
                        min="0.01"
                        step="0.01"
                        placeholder="Ej: 8100.00"
                        value={precioVenta}
                        onChange={e => handleChangePrecioVenta(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="ficha-campo">
                    <label className="ficha-label">Precio por unidad</label>
                    <input
                      type="text"
                      className="ficha-input ficha-input-solo-lectura ficha-input-angosto"
                      readOnly
                      value={precioPorUnidadCalc != null ? `$${precioPorUnidadCalc.toFixed(2)}` : '—'}
                    />
                  </div>
                  {errorPrecio && <div className="ficha-error">{errorPrecio}</div>}
                  <div className="ficha-form-precio-acciones">
                    <button className="ficha-btn-guardar" onClick={handleAgregarPrecio}>
                      Agregar tramo
                    </button>
                    <button className="ficha-btn-cancelar" onClick={() => { setMostrarFormPrecio(false); setErrorPrecio(''); setDescuentoPct('') }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="ficha-precios-nota">
                La cantidad de cada tramo se cuenta en la misma unidad que cargaste como producto: si cargaste un pack, la cantidad se mide en packs; si cargaste una unidad individual, se mide en unidades individuales.
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
                <button className="ficha-btn-guardar" onClick={handleAplicarDescuento}>
                  Aplicar
                </button>
              </div>
              {errorDescuento && <div className="ficha-error">{errorDescuento}</div>}
              <span className="ficha-ayuda">Al aplicar, baja ese porcentaje en el precio base y en todos los tramos cargados hasta ahora. Se guarda todo junto al guardar el producto.</span>
            </div>

            {errorProducto && <div className="ficha-error">{errorProducto}</div>}

          </div>

          <div className="ficha-sidebar">
            <div className="ficha-card ficha-card-estado">
              <div className="ficha-sidebar-titulo">Estado</div>
              <div className="ficha-estado-texto">Pausado</div>
              <span className="ficha-estado-nota">El producto se crea pausado. Publicalo una vez que tenga precios.</span>
            </div>
            <div className="ficha-card">
              <button className="ficha-btn-guardar" onClick={handleGuardarProducto} disabled={cargandoProducto}>
                {cargandoProducto ? 'Guardando…' : 'Guardar producto'}
              </button>
              <button className="ficha-btn-cancelar" onClick={() => navigate('/inicio')} disabled={cargandoProducto}>
               Cancelar
              </button>
            </div>

            <div className="ficha-preview-bloque">
              <div className="ficha-sidebar-titulo">Así se va a ver en el catálogo</div>
              <TarjetaProductoPreview
                nombre={nombreEfectivo}
                marca={marca}
                magnitudValor={magnitudValor}
                magnitudUnidad={magnitudUnidad}
                categoriaNombre={categoriaNombre}
                descripcion={descripcion}
                imagenSrc={imagenPreview}
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

export default FichaProducto
