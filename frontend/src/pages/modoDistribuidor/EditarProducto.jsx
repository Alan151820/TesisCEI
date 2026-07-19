import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import './FichaProducto.css'

const API = 'http://localhost:3000'

function EditarProducto() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const [categorias, setCategorias] = useState([])
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagenArchivo, setImagenArchivo] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [imagenUrlActual, setImagenUrlActual] = useState(null)
  const [categoriaId, setCategoriaId] = useState('')
  const [tipo, setTipo] = useState('')
  const [stockTotal, setStockTotal] = useState('')
  const [cantidadMinimaCompra, setCantidadMinimaCompra] = useState('')
  const [descripcionUnidadVenta, setDescripcionUnidadVenta] = useState('')
  const [unidadBaseInterna, setUnidadBaseInterna] = useState('')
  const [incrementoVenta, setIncrementoVenta] = useState('')
  const [metricaVisualizacion, setMetricaVisualizacion] = useState('')
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
  const [precioCosto, setPrecioCosto] = useState('')
  const [errorPrecio, setErrorPrecio] = useState('')
  const [cargandoPrecio, setCargandoPrecio] = useState(false)

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/productos/categorias`),
      axios.get(`${API}/api/productos/${id}`, { headers }),
      axios.get(`${API}/api/productos/${id}/precios`, { headers }),
    ])
      .then(([catRes, prodRes, preciosRes]) => {
        setCategorias(catRes.data)
        const p = prodRes.data
        setNombre(p.nombre)
        setDescripcion(p.descripcion || '')
        setImagenUrlActual(p.imagenUrl)
        setCategoriaId(String(p.categoriaId))
        setTipo(p.tipoProducto)
        setStockTotal(p.stockTotal ?? '')
        setUmbralMinimoStock(p.umbralMinimoStock ?? '')
        setCantidadMinimaCompra(p.cantidadMinimaCompra ?? '')
        setDescripcionUnidadVenta(p.descripcionUnidadVenta || '')
        setUnidadBaseInterna(p.unidadBaseInterna || '')
        setIncrementoVenta(p.incrementoVenta ?? '')
        setMetricaVisualizacion(p.metricaVisualizacion || '')
        setPrecios(preciosRes.data)
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
    setCargandoProducto(true)
    try {
      const formData = new FormData()
      formData.append('nombre', nombre)
      formData.append('descripcion', descripcion)
      formData.append('categoriaId', categoriaId)
      formData.append('cantidadMinimaCompra', cantidadMinimaCompra)
      formData.append('stockTotal', stockTotal)
      if (tipo === 'empaquetado') formData.append('descripcionUnidadVenta', descripcionUnidadVenta)
      if (tipo === 'fraccionable') {
        formData.append('unidadBaseInterna', unidadBaseInterna)
        formData.append('incrementoVenta', incrementoVenta)
        formData.append('metricaVisualizacion', metricaVisualizacion)
      }
      if (imagenArchivo) formData.append('imagen', imagenArchivo)

      await axios.put(`${API}/api/productos/${id}`, formData, { headers })
      setGuardado(true)
    } catch (err) {
      setErrorProducto(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCargandoProducto(false)
    }
  }

  const handleAgregarPrecio = async () => {
    setErrorPrecio('')
    setCargandoPrecio(true)
    try {
      const res = await axios.post(
        `${API}/api/productos/${id}/precios`,
        { cantidadMinima, precioVenta, precioCosto: precioCosto || undefined },
        { headers }
      )
      setPrecios(prev => [...prev, res.data.precio])
      setCantidadMinima('')
      setPrecioVenta('')
      setPrecioCosto('')
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
      const res = await axios.put(
        `${API}/api/productos/${id}/precios/${precioId}`,
        { cantidadMinima, precioVenta, precioCosto: precioCosto || undefined },
        { headers }
      )
      setPrecios(prev => prev.map(p => p.id === precioId ? res.data.precio : p))
      setEditandoPrecioId(null)
      setCantidadMinima('')
      setPrecioVenta('')
      setPrecioCosto('')
    } catch (err) {
      setErrorPrecio(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCargandoPrecio(false)
    }
  }

  const handleEliminarPrecio = async (precioId) => {
    try {
      await axios.delete(`${API}/api/productos/${id}/precios/${precioId}`, { headers })
      setPrecios(prev => prev.filter(p => p.id !== precioId))
    } catch (err) {
      setErrorPrecio(err.response?.data?.error || 'No fue posible eliminar el precio.')
    }
  }

  const handleGuardarUmbral = async () => {
    setErrorUmbral('')
    setUmbralGuardado(false)
    setCargandoUmbral(true)
    try {
      await axios.patch(`${API}/api/productos/${id}/umbral`, { valor: Number(umbralMinimoStock) }, { headers })
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
    setPrecioVenta(p.precioVenta)
    setPrecioCosto(p.precioCosto ?? '')
    setMostrarFormPrecio(false)
    setErrorPrecio('')
  }

  const cancelarEdicionPrecio = () => {
    setEditandoPrecioId(null)
    setCantidadMinima('')
    setPrecioVenta('')
    setPrecioCosto('')
    setErrorPrecio('')
  }

  if (cargandoInicial) return <div className="ficha-fondo"><div className="ficha-contenedor">Cargando...</div></div>
  if (errorCarga) return <div className="ficha-fondo"><div className="ficha-contenedor ficha-error">{errorCarga}</div></div>

  return (
    <div className="ficha-fondo">
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
                    <label className="ficha-label">Nombre del producto <span className="ficha-requerido">*</span></label>
                    <input
                      type="text"
                      className="ficha-input"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Ej: Queso Colonia 1kg"
                    />
                  </div>

                  <div className="ficha-fila-dos">
                    <div className="ficha-campo">
                      <label className="ficha-label">Categoría <span className="ficha-requerido">*</span></label>
                      <select className="ficha-select" value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
                        <option value="">Seleccioná una categoría</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="ficha-campo">
                      <label className="ficha-label">Tipo de producto</label>
                      <div className="ficha-estado-texto" style={{ paddingTop: '0.4rem' }}>
                        {tipo === 'fraccionable' ? 'Fraccionable' : 'Empaquetado'}
                      </div>
                      <span className="ficha-ayuda">El tipo no puede modificarse.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ficha-campo">
                <label className="ficha-label">Descripción</label>
                <textarea className="ficha-textarea" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción del producto" />
              </div>

              {tipo === 'empaquetado' && (
                <div className="ficha-fila-dos">
                  <div className="ficha-campo">
                    <label className="ficha-label">Descripción de la unidad de venta</label>
                    <input type="text" className="ficha-input" value={descripcionUnidadVenta} onChange={e => setDescripcionUnidadVenta(e.target.value)} placeholder="Ej: Bloque de 1kg" />
                  </div>
                  <div className="ficha-campo">
                    <label className="ficha-label">Cantidad mínima de compra <span className="ficha-requerido">*</span></label>
                    <input type="number" className="ficha-input" min="1" value={cantidadMinimaCompra} onChange={e => setCantidadMinimaCompra(e.target.value)} placeholder="En unidades" />
                  </div>
                </div>
              )}

              {tipo === 'fraccionable' && (
                <>
                  <div className="ficha-fila-tres">
                    <div className="ficha-campo">
                      <label className="ficha-label">Unidad base interna</label>
                      <div className="ficha-estado-texto" style={{ paddingTop: '0.4rem' }}>
                        {unidadBaseInterna ? unidadBaseInterna.charAt(0).toUpperCase() + unidadBaseInterna.slice(1) : '—'}
                      </div>
                      <span className="ficha-ayuda">No modificable.</span>
                    </div>
                    <div className="ficha-campo">
                      <label className="ficha-label">Incremento de venta <span className="ficha-requerido">*</span></label>
                      <input type="number" className="ficha-input" min="0.01" step="0.01" value={incrementoVenta} onChange={e => setIncrementoVenta(e.target.value)} placeholder="Ej: 0.5" />
                    </div>
                    <div className="ficha-campo">
                      <label className="ficha-label">Métrica de visualización <span className="ficha-requerido">*</span></label>
                      <select className="ficha-select" value={metricaVisualizacion} onChange={e => setMetricaVisualizacion(e.target.value)}>
                        <option value="">Seleccioná</option>
                        <option value="kilogramos">Kilogramos</option>
                        <option value="litros">Litros</option>
                        <option value="metros">Metros</option>
                      </select>
                    </div>
                  </div>
                  <div className="ficha-campo">
                    <label className="ficha-label">Cantidad mínima de compra <span className="ficha-requerido">*</span></label>
                    <input type="number" className="ficha-input" min="0.01" step="0.01" value={cantidadMinimaCompra} onChange={e => setCantidadMinimaCompra(e.target.value)} placeholder="En unidad de visualización" />
                  </div>
                </>
              )}

              <div className="ficha-campo">
                <label className="ficha-label">Stock total <span className="ficha-requerido">*</span></label>
                <input type="number" className="ficha-input ficha-input-angosto" min="0" value={stockTotal} onChange={e => setStockTotal(e.target.value)} placeholder="0" />
                <span className="ficha-ayuda">No puede reducirse por debajo del stock reservado.</span>
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
              {umbralGuardado && <div className="ficha-ok-texto" style={{ color: '#2a7a2a', fontSize: '13px', marginTop: '8px' }}>Umbral configurado correctamente.</div>}
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
                    + Agregar precio
                  </button>
                )}
              </div>

              <div className="ficha-precios-tabla">
                <div className="ficha-precios-thead">
                  <div>Cant. mínima</div>
                  <div>Precio de venta</div>
                  <div>Precio de costo</div>
                  <div></div>
                </div>

                {precios.length === 0 && !mostrarFormPrecio && (
                  <div className="ficha-precios-vacio">Sin precios registrados.</div>
                )}

                {precios.map(p => (
                  <div key={p.id}>
                    {editandoPrecioId === p.id ? (
                      <div className="ficha-form-precio">
                        <div className="ficha-fila-tres">
                          <div className="ficha-campo">
                            <label className="ficha-label">Cant. mínima <span className="ficha-requerido">*</span></label>
                            <input type="number" className="ficha-input" min="0.01" step="0.01" value={cantidadMinima} onChange={e => setCantidadMinima(e.target.value)} />
                          </div>
                          <div className="ficha-campo">
                            <label className="ficha-label">Precio de venta <span className="ficha-requerido">*</span></label>
                            <input type="number" className="ficha-input" min="0.01" step="0.01" value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} />
                          </div>
                          <div className="ficha-campo">
                            <label className="ficha-label">Precio de costo</label>
                            <input type="number" className="ficha-input" min="0" step="0.01" placeholder="Opcional" value={precioCosto} onChange={e => setPrecioCosto(e.target.value)} />
                          </div>
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
                        <div>{p.cantidadMinima} u.</div>
                        <div>${Number(p.precioVenta).toFixed(2)}</div>
                        <div>{p.precioCosto != null ? `$${Number(p.precioCosto).toFixed(2)}` : '—'}</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span className="ficha-precio-eliminar" style={{ cursor: 'pointer' }} onClick={() => iniciarEdicionPrecio(p)}>✎</span>
                          <span className="ficha-precio-eliminar" onClick={() => handleEliminarPrecio(p.id)}>✕</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {mostrarFormPrecio && (
                <div className="ficha-form-precio">
                  <div className="ficha-fila-tres">
                    <div className="ficha-campo">
                      <label className="ficha-label">Cant. mínima <span className="ficha-requerido">*</span></label>
                      <input type="number" className="ficha-input" min="0.01" step="0.01" placeholder="Ej: 6" value={cantidadMinima} onChange={e => setCantidadMinima(e.target.value)} />
                    </div>
                    <div className="ficha-campo">
                      <label className="ficha-label">Precio de venta <span className="ficha-requerido">*</span></label>
                      <input type="number" className="ficha-input" min="0.01" step="0.01" placeholder="Ej: 450.00" value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} />
                    </div>
                    <div className="ficha-campo">
                      <label className="ficha-label">Precio de costo</label>
                      <input type="number" className="ficha-input" min="0" step="0.01" placeholder="Opcional" value={precioCosto} onChange={e => setPrecioCosto(e.target.value)} />
                    </div>
                  </div>
                  {errorPrecio && <div className="ficha-error">{errorPrecio}</div>}
                  <div className="ficha-form-precio-acciones">
                    <button className="ficha-btn-guardar" onClick={handleAgregarPrecio} disabled={cargandoPrecio}>
                      {cargandoPrecio ? 'Guardando…' : 'Guardar precio'}
                    </button>
                    <button className="ficha-btn-cancelar" onClick={() => { setMostrarFormPrecio(false); setErrorPrecio('') }} disabled={cargandoPrecio}>Cancelar</button>
                  </div>
                </div>
              )}

              <div className="ficha-precios-nota">
                Para publicar el producto necesitás al menos un precio por volumen.
              </div>
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
          </div>
        </div>

      </div>
    </div>
  )
}

export default EditarProducto
