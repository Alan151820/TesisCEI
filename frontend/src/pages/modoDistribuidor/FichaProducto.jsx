import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import './FichaProducto.css'

const API = 'http://localhost:3000'

function FichaProducto() {
  const navigate = useNavigate()
  const { id: productoIdParam } = useParams()
  const modoEdicion = Boolean(productoIdParam)

  // --- Estado del producto ---
  const [categorias, setCategorias] = useState([])
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagenArchivo, setImagenArchivo] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [categoriaId, setCategoriaId] = useState('')
  const [tipo, setTipo] = useState('')
  const [stockInicial, setStockInicial] = useState('')
  const [cantidadMinimaCompra, setCantidadMinimaCompra] = useState('')
  const [descripcionUnidadVenta, setDescripcionUnidadVenta] = useState('')
  const [unidadBaseInterna, setUnidadBaseInterna] = useState('')
  const [incrementoVenta, setIncrementoVenta] = useState('')
  const [metricaVisualizacion, setMetricaVisualizacion] = useState('')
  const [errorProducto, setErrorProducto] = useState('')
  const [cargandoProducto, setCargandoProducto] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(modoEdicion)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [cargandoEliminar, setCargandoEliminar] = useState(false)
  const [mensajeEliminar, setMensajeEliminar] = useState('')

  // --- Estado del producto recién creado (para habilitar precios) ---
  const [productoId, setProductoId] = useState(null)

  // --- Estado de precios por volumen ---
  const [precios, setPrecios] = useState([])
  const [mostrarFormPrecio, setMostrarFormPrecio] = useState(false)
  const [cantidadMinima, setCantidadMinima] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [precioCosto, setPrecioCosto] = useState('')
  const [errorPrecio, setErrorPrecio] = useState('')
  const [cargandoPrecio, setCargandoPrecio] = useState(false)

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    axios.get(`${API}/api/productos/categorias`)
      .then(res => setCategorias(res.data))
      .catch(() => setErrorProducto('No se pudieron cargar las categorías.'))
  }, [])

  // En modo edición: cargar datos actuales del producto
  useEffect(() => {
    if (!modoEdicion) return
    setCargandoDatos(true)
    axios.get(`${API}/api/productos/${productoIdParam}`, { headers })
      .then(res => {
        const p = res.data
        setNombre(p.nombre || '')
        setDescripcion(p.descripcion || '')
        setCategoriaId(String(p.categoriaId))
        setTipo(p.tipoProducto || '')
        setStockInicial(String(p.stockTotal ?? ''))
        setCantidadMinimaCompra(String(p.cantidadMinimaCompra ?? ''))
        setDescripcionUnidadVenta(p.descripcionUnidadVenta || '')
        setUnidadBaseInterna(p.unidadBaseInterna || '')
        setIncrementoVenta(p.incrementoVenta != null ? String(p.incrementoVenta) : '')
        setMetricaVisualizacion(p.metricaVisualizacion || '')
        if (p.imagenUrl) setImagenPreview(`${API}${p.imagenUrl}`)
      })
      .catch(() => setErrorProducto('No se pudieron cargar los datos del producto.'))
      .finally(() => setCargandoDatos(false))
  }, [productoIdParam])

  const handleTipoChange = (nuevoTipo) => {
    setTipo(nuevoTipo)
    setDescripcionUnidadVenta('')
    setCantidadMinimaCompra('')
    setUnidadBaseInterna('')
    setIncrementoVenta('')
    setMetricaVisualizacion('')
  }

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
      formData.append('tipo', tipo)
      formData.append('stockInicial', stockInicial || 0)
      formData.append('cantidadMinimaCompra', cantidadMinimaCompra)
      if (tipo === 'empaquetado') formData.append('descripcionUnidadVenta', descripcionUnidadVenta)
      if (tipo === 'fraccionable') {
        formData.append('unidadBaseInterna', unidadBaseInterna)
        formData.append('incrementoVenta', incrementoVenta)
        formData.append('metricaVisualizacion', metricaVisualizacion)
      }
      if (imagenArchivo) formData.append('imagen', imagenArchivo)

      const res = await axios.post(`${API}/api/productos`, formData, { headers })
      setProductoId(res.data.producto.id)
    } catch (err) {
      setErrorProducto(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCargandoProducto(false)
    }
  }

  const handleActualizarProducto = async () => {
    setErrorProducto('')
    setCargandoProducto(true)
    try {
      const formData = new FormData()
      formData.append('nombre', nombre)
      formData.append('descripcion', descripcion)
      formData.append('categoriaId', categoriaId)
      formData.append('tipoProducto', tipo)
      formData.append('stockTotal', stockInicial)
      formData.append('cantidadMinimaCompra', cantidadMinimaCompra)
      if (tipo === 'empaquetado') formData.append('descripcionUnidadVenta', descripcionUnidadVenta)
      if (tipo === 'fraccionable') {
        formData.append('incrementoVenta', incrementoVenta)
        formData.append('metricaVisualizacion', metricaVisualizacion)
      }
      if (imagenArchivo) formData.append('imagen', imagenArchivo)

      await axios.put(`${API}/api/productos/${productoIdParam}`, formData, { headers })
      navigate('/inicio')
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
        `${API}/api/productos/${productoId}/precios`,
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

  const handleEliminarPrecio = (id) => {
    setPrecios(prev => prev.filter(p => p.id !== id))
  }

  const handleFinalizar = () => navigate('/inicio')

  const handleEliminarProducto = async () => {
    setCargandoEliminar(true)
    try {
      const res = await axios.delete(`${API}/api/productos/${productoIdParam}`, { headers })
      setMensajeEliminar(res.data.mensaje)
      setConfirmarEliminar(false)
    } catch (err) {
      setMensajeEliminar(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
      setConfirmarEliminar(false)
    } finally {
      setCargandoEliminar(false)
    }
  }

  // Vista después de guardar el producto (solo creación) — sección de precios
  if (productoId) {
    return (
      <div className="ficha-fondo">
        <div className="ficha-contenedor">

          <div className="ficha-breadcrumb">
            <span className="ficha-breadcrumb-link" onClick={() => navigate('/inicio')}>Mis productos</span>
            <span className="ficha-breadcrumb-sep">›</span>
            <span>Nuevo producto</span>
          </div>

          <div className="ficha-layout">
            <div className="ficha-columna-principal">

              <div className="ficha-card ficha-card-ok">
                <span className="ficha-ok-icono">✓</span>
                <span className="ficha-ok-texto">Producto guardado correctamente.</span>
              </div>

              {/* Sección precios por volumen */}
              <div className="ficha-card">
                <div className="ficha-precios-header">
                  <div className="ficha-card-titulo">Precios por volumen</div>
                  {!mostrarFormPrecio && (
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
                    <div className="ficha-precios-vacio">
                      Sin precios registrados. Agregá al menos uno para poder publicar el producto.
                    </div>
                  )}

                  {precios.map(p => (
                    <div key={p.id} className="ficha-precios-fila">
                      <div>{p.cantidadMinima} u.</div>
                      <div>${Number(p.precioVenta).toFixed(2)}</div>
                      <div>{p.precioCosto != null ? `$${Number(p.precioCosto).toFixed(2)}` : '—'}</div>
                      <div>
                        <span className="ficha-precio-eliminar" onClick={() => handleEliminarPrecio(p.id)}>✕</span>
                      </div>
                    </div>
                  ))}
                </div>

                {mostrarFormPrecio && (
                  <div className="ficha-form-precio">
                    <div className="ficha-fila-tres">
                      <div className="ficha-campo">
                        <label className="ficha-label">Cant. mínima <span className="ficha-requerido">*</span></label>
                        <input
                          type="number"
                          className="ficha-input"
                          min="0.01"
                          step="0.01"
                          placeholder="Ej: 6"
                          value={cantidadMinima}
                          onChange={e => setCantidadMinima(e.target.value)}
                        />
                      </div>
                      <div className="ficha-campo">
                        <label className="ficha-label">Precio de venta <span className="ficha-requerido">*</span></label>
                        <input
                          type="number"
                          className="ficha-input"
                          min="0.01"
                          step="0.01"
                          placeholder="Ej: 450.00"
                          value={precioVenta}
                          onChange={e => setPrecioVenta(e.target.value)}
                        />
                      </div>
                      <div className="ficha-campo">
                        <label className="ficha-label">Precio de costo</label>
                        <input
                          type="number"
                          className="ficha-input"
                          min="0"
                          step="0.01"
                          placeholder="Opcional"
                          value={precioCosto}
                          onChange={e => setPrecioCosto(e.target.value)}
                        />
                      </div>
                    </div>
                    {errorPrecio && <div className="ficha-error">{errorPrecio}</div>}
                    <div className="ficha-form-precio-acciones">
                      <button className="ficha-btn-guardar" onClick={handleAgregarPrecio} disabled={cargandoPrecio}>
                        {cargandoPrecio ? 'Guardando…' : 'Guardar precio'}
                      </button>
                      <button className="ficha-btn-cancelar" onClick={() => { setMostrarFormPrecio(false); setErrorPrecio('') }} disabled={cargandoPrecio}>
                        Cancelar
                      </button>
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
                <button className="ficha-btn-guardar" onClick={handleFinalizar}>
                  Ir al panel de productos
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  if (cargandoDatos) {
    return <div className="ficha-fondo"><div className="ficha-contenedor">Cargando...</div></div>
  }

  // Vista formulario (creación o edición)
  return (
    <div className="ficha-fondo">
      <div className="ficha-contenedor">

        <div className="ficha-breadcrumb">
          <span className="ficha-breadcrumb-link" onClick={() => navigate('/inicio')}>Mis productos</span>
          <span className="ficha-breadcrumb-sep">›</span>
          <span>{modoEdicion ? 'Editar producto' : 'Nuevo producto'}</span>
        </div>

        <div className="ficha-layout">
          <div className="ficha-columna-principal">

            <div className="ficha-card">
              <div className="ficha-card-titulo">Datos del producto</div>

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
                      <label className="ficha-label">Tipo de producto <span className="ficha-requerido">*</span></label>
                      <div className="ficha-radio-grupo">
                        <label className="ficha-radio-label">
                          <input type="radio" name="tipo" value="empaquetado" checked={tipo === 'empaquetado'} onChange={() => handleTipoChange('empaquetado')} />
                          Empaquetado
                        </label>
                        <label className="ficha-radio-label">
                          <input type="radio" name="tipo" value="fraccionable" checked={tipo === 'fraccionable'} onChange={() => handleTipoChange('fraccionable')} />
                          Fraccionable
                        </label>
                      </div>
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
                    <span className="ficha-ayuda">Solo para productos Empaquetados</span>
                  </div>
                  <div className="ficha-campo">
                    <label className="ficha-label">Cantidad mínima de compra <span className="ficha-requerido">*</span></label>
                    <input type="number" className="ficha-input" min="1" value={cantidadMinimaCompra} onChange={e => setCantidadMinimaCompra(e.target.value)} placeholder="En unidades" />
                    <span className="ficha-ayuda">En unidades (Empaquetado)</span>
                  </div>
                </div>
              )}

              {tipo === 'fraccionable' && (
                <>
                  <div className="ficha-fila-tres">
                    <div className="ficha-campo">
                      <label className="ficha-label">Unidad base interna <span className="ficha-requerido">*</span></label>
                      <select className="ficha-select" value={unidadBaseInterna} onChange={e => setUnidadBaseInterna(e.target.value)}>
                        <option value="">Seleccioná</option>
                        <option value="gramo">Gramo</option>
                        <option value="mililitro">Mililitro</option>
                        <option value="centimetro">Centímetro</option>
                      </select>
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
                    <span className="ficha-ayuda">En la unidad de visualización seleccionada</span>
                  </div>
                </>
              )}

              <div className="ficha-campo">
                <label className="ficha-label">Stock {modoEdicion ? 'actual' : 'inicial'} <span className="ficha-requerido">*</span></label>
                <input type="number" className="ficha-input ficha-input-angosto" min="0" value={stockInicial} onChange={e => setStockInicial(e.target.value)} placeholder="0" />
                <span className="ficha-ayuda">No puede reducirse por debajo del stock reservado.</span>
              </div>

              {errorProducto && <div className="ficha-error">{errorProducto}</div>}
            </div>

          </div>

          <div className="ficha-sidebar">
            {!modoEdicion && (
              <div className="ficha-card ficha-card-estado">
                <div className="ficha-sidebar-titulo">Estado</div>
                <div className="ficha-estado-texto">Pausado</div>
                <span className="ficha-estado-nota">El producto se crea pausado. Publicalo una vez que tenga precios.</span>
              </div>
            )}
            <div className="ficha-card">
              <button
                className="ficha-btn-guardar"
                onClick={modoEdicion ? handleActualizarProducto : handleGuardarProducto}
                disabled={cargandoProducto}
              >
                {cargandoProducto ? 'Guardando…' : (modoEdicion ? 'Guardar cambios' : 'Guardar producto')}
              </button>
              <button className="ficha-btn-cancelar" onClick={() => navigate('/inicio')} disabled={cargandoProducto}>
                Cancelar
              </button>
            </div>
            {modoEdicion && (
              <div className="ficha-card ficha-card-peligro">
                <div className="ficha-peligro-titulo">Zona de peligro</div>
                {mensajeEliminar ? (
                  <div className="ficha-eliminar-mensaje">{mensajeEliminar}</div>
                ) : confirmarEliminar ? (
                  <div className="ficha-confirmar-eliminar">
                    <p className="ficha-confirmar-texto">¿Estás seguro? Esta acción no puede revertirse.</p>
                    <button className="ficha-btn-eliminar-confirmar" onClick={handleEliminarProducto} disabled={cargandoEliminar}>
                      {cargandoEliminar ? 'Eliminando…' : 'Confirmar eliminación'}
                    </button>
                    <button className="ficha-btn-cancelar" onClick={() => setConfirmarEliminar(false)} disabled={cargandoEliminar}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button className="ficha-btn-eliminar" onClick={() => setConfirmarEliminar(true)}>
                    Eliminar producto
                  </button>
                )}
                {mensajeEliminar && (
                  <button className="ficha-btn-cancelar" style={{ marginTop: '8px' }} onClick={() => navigate('/inicio')}>
                    Volver al panel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default FichaProducto
