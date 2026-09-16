import { useState, useEffect } from 'react'
import { mensajeDeError } from '../../lib/errores'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/axios'
import TarjetaProductoPreview from '../../components/TarjetaProductoPreview'
import FormularioTramoPrecio from '../../components/FormularioTramoPrecio'
import Hdr from '../../components/Hdr'
import Tarjeta from '../../components/ui/Tarjeta'
import Campo from '../../components/ui/Campo'
import Boton from '../../components/ui/Boton'
import Miga from '../../components/ui/Miga'
import { convertirAWebP } from '../../lib/imagenProducto'
import { totalDesdeDescuento, descuentoDesdeTotal, precioUnitario } from '../../lib/tramoPrecio'
import './FichaProducto.css'
import Marca from '../../components/Marca'

const API = 'http://localhost:3000'

function EditarProducto() {
  const navigate = useNavigate()
  const { id } = useParams()

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
        const matchPack = p.nombre.match(/^(.*)\sx(\d+)$/i)
        if (matchPack) {
          setNombre(matchPack[1].trim())
          setIncluyeCantidad(true)
          setCantidadNombre(matchPack[2])
        } else {
          setNombre(p.nombre)
        }
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
      setErrorProducto(mensajeDeError(err))
    } finally {
      setCargandoProducto(false)
    }
  }

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
      setErrorPrecio(mensajeDeError(err))
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
      setErrorPrecio(mensajeDeError(err))
    } finally {
      setCargandoPrecio(false)
    }
  }

  const handleChangeCantidadMinima = (value) => {
    setCantidadMinima(value)
    const cant = Number(value)
    if (!precioBaseRef || !cant) return
    if (descuentoPct !== '') {
      setPrecioVenta(totalDesdeDescuento(precioBaseRef, cant, descuentoPct))
    } else if (precioVenta !== '') {
      setDescuentoPct(String(descuentoDesdeTotal(precioBaseRef, cant, precioVenta)))
    }
  }

  const handleChangeDescuentoPct = (value) => {
    setDescuentoPct(value)
    const cant = Number(cantidadMinima)
    if (value === '' || !precioBaseRef || !cant) return
    setPrecioVenta(totalDesdeDescuento(precioBaseRef, cant, value))
  }

  const handleChangePrecioVenta = (value) => {
    setPrecioVenta(value)
    const cant = Number(cantidadMinima)
    if (value === '' || !precioBaseRef || !cant) return
    setDescuentoPct(String(descuentoDesdeTotal(precioBaseRef, cant, value)))
  }

  const precioPorUnidadCalc = precioUnitario(precioVenta, cantidadMinima)

  const handleEliminarPrecio = async (precioId) => {
    try {
      const res = await api.delete(`/api/productos/${id}/precios/${precioId}`)
      if (res.data.tipoResultado === 'PRODUCTO_DESHABILITADO') {
        alert(res.data.mensaje)
        navigate('/inicio')
        return
      }
      setPrecios(prev => prev.filter(p => p.id !== precioId))
    } catch (err) {
      setErrorPrecio(mensajeDeError(err, 'No fue posible eliminar el precio.'))
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
      setErrorUmbral(mensajeDeError(err))
    } finally {
      setCargandoUmbral(false)
    }
  }

  const iniciarEdicionPrecio = (p) => {
    setEditandoPrecioId(p.id)
    setCantidadMinima(p.cantidadMinima)
    const total = Number(p.precioVenta) * Number(p.cantidadMinima)
    setPrecioVenta(total.toFixed(2))
    setDescuentoPct(String(descuentoDesdeTotal(precioBaseRef, p.cantidadMinima, total)))
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

  const nombreEfectivo = incluyeCantidad && cantidadNombre
    ? `${nombre.trim()} x${cantidadNombre}`
    : nombre

  const categoriaNombre = categorias.find(c => String(c.id) === String(categoriaId))?.nombre
  const precioMinimoPreview = precios.length > 0
    ? Math.min(...precios.map(p => Number(p.precioVenta)))
    : 0
  const imagenSrcPreview = imagenPreview || (imagenUrlActual ? `${API}${imagenUrlActual}` : null)

  if (cargandoInicial) return <div className="ficha-fondo"><div className="ficha-contenedor">Cargando...</div></div>
  if (errorCarga) return <div className="ficha-fondo"><div className="ficha-contenedor ficha-error">{errorCarga}</div></div>

  return (
    <div className="ficha-fondo">
      <Hdr className="ficha-hdr-desktop" logo={<span className="hdr-logo" onClick={() => navigate('/inicio')}><Marca /></span>}>
        <span className="link" onClick={() => navigate('/inicio')}>← Volver a mis productos</span>
      </Hdr>
      <div className="ficha-mobile-header">
        <button type="button" className="ficha-mobile-volver" onClick={() => navigate('/inicio')}>←</button>
        <div className="ficha-mobile-titulo">Editar producto</div>
      </div>
      <div className="ficha-contenedor">

        <Miga className="ficha-breadcrumb" items={[{ etiqueta: 'Mis productos', to: '/inicio' }, { etiqueta: 'Editar producto' }]} />

        {guardado && (
          <Tarjeta className="ficha-card ficha-card-ok" style={{ marginBottom: '1rem' }}>
            <span className="ficha-ok-icono">✓</span>
            <span className="ficha-ok-texto">Producto actualizado correctamente.</span>
          </Tarjeta>
        )}

        <div className="ficha-layout">
          <div className="ficha-columna-principal">

            <Tarjeta className="ficha-card">
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
                      <Campo
                        type="text"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        placeholder="Ej: Gaseosa"
                      />
                      {incluyeCantidad && (
                        <Campo
                          type="number"
                          className="ficha-input-cantidad"
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
                    <Campo type="text" value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej: Coca Cola" />
                  </div>
                </div>
              </div>

              <div className="ficha-fila-dos">
                <div className="ficha-campo">
                  <label className="ficha-label">Contenido / Longitud <span className="ficha-ayuda-inline">opcional</span></label>
                  <div className="ficha-magnitud">
                    <Campo type="number" className="ficha-magnitud-valor" min="0" step="0.01" placeholder="Ej: 1.5" value={magnitudValor} onChange={e => setMagnitudValor(e.target.value)} />
                    <Campo as="select" className="ficha-magnitud-unidad" value={magnitudUnidad} onChange={e => setMagnitudUnidad(e.target.value)}>
                      <option value="">—</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="l">L</option>
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                    </Campo>
                  </div>
                  <span className="ficha-ayuda">Solo arma el título. No afecta precio ni stock.</span>
                </div>

                <div className="ficha-campo">
                  <label className="ficha-label">Categoría <span className="ficha-requerido">*</span></label>
                  <Campo as="select" value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
                    <option value="">Seleccioná una categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </Campo>
                </div>
              </div>

              <div className="ficha-campo">
                <label className="ficha-label">Descripción</label>
                <Campo area value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción del producto" />
              </div>

              <div className="ficha-fila-dos">
                <div className="ficha-campo">
                  <label className="ficha-label">Stock total <span className="ficha-requerido">*</span></label>
                  <Campo type="number" className="ficha-input-angosto" min="0" value={stockTotal} onChange={e => setStockTotal(e.target.value)} placeholder="0" />
                  <span className="ficha-ayuda">No puede reducirse por debajo del stock reservado.</span>
                </div>
                <div className="ficha-campo">
                  <label className="ficha-label">Precio de costo <span className="ficha-ayuda-inline">opcional</span></label>
                  <Campo type="number" className="ficha-input-angosto" min="0" step="0.01" placeholder="Opcional" value={precioCosto} onChange={e => setPrecioCosto(e.target.value)} />
                  <span className="ficha-ayuda">Lo que te cuesta a vos este producto.</span>
                </div>
              </div>

              {errorProducto && <div className="ficha-error">{errorProducto}</div>}
            </Tarjeta>

            <Tarjeta className="ficha-card">
              <div className="ficha-card-titulo">Alerta de stock bajo</div>
              <div className="ficha-campo">
                <label className="ficha-label">Umbral mínimo de stock</label>
                <Campo
                  type="number"
                  className="ficha-input-angosto"
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
              <div style={{ marginTop: '12px' }} className="col">
                <Boton onClick={handleGuardarUmbral} disabled={cargandoUmbral}>
                  {cargandoUmbral ? 'Guardando…' : 'Guardar umbral'}
                </Boton>
              </div>
            </Tarjeta>

            <Tarjeta className="ficha-card">
              <div className="ficha-precios-header">
                <div className="ficha-card-titulo">Precios por volumen</div>
                {!mostrarFormPrecio && editandoPrecioId === null && (
                  <Boton variante="outline" onClick={() => setMostrarFormPrecio(true)}>
                    + Agregar tramo
                  </Boton>
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
                        <FormularioTramoPrecio
                          cantidadMinima={cantidadMinima}
                          descuentoPct={descuentoPct}
                          precioVenta={precioVenta}
                          precioPorUnidadCalc={precioPorUnidadCalc}
                          onCantidad={handleChangeCantidadMinima}
                          onDescuento={handleChangeDescuentoPct}
                          onPrecio={handleChangePrecioVenta}
                          onGuardar={() => handleEditarPrecio(p.id)}
                          onCancelar={cancelarEdicionPrecio}
                          textoGuardar="Guardar cambios"
                          error={errorPrecio}
                          cargando={cargandoPrecio}
                        />
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
                <FormularioTramoPrecio
                  cantidadMinima={cantidadMinima}
                  descuentoPct={descuentoPct}
                  precioVenta={precioVenta}
                  precioPorUnidadCalc={precioPorUnidadCalc}
                  onCantidad={handleChangeCantidadMinima}
                  onDescuento={handleChangeDescuentoPct}
                  onPrecio={handleChangePrecioVenta}
                  onGuardar={handleAgregarPrecio}
                  onCancelar={() => { setMostrarFormPrecio(false); setErrorPrecio(''); setDescuentoPct('') }}
                  textoGuardar="Guardar tramo"
                  error={errorPrecio}
                  cargando={cargandoPrecio}
                />
              )}

              <div className="ficha-precios-nota">
                Para publicar el producto necesitás al menos un precio por volumen.
              </div>
            </Tarjeta>

          </div>

          <div className="ficha-sidebar">
            <Tarjeta className="ficha-card col gap-s">
              <Boton onClick={handleGuardarProducto} disabled={cargandoProducto}>
                {cargandoProducto ? 'Guardando…' : 'Guardar cambios'}
              </Boton>
              <Boton variante="outline" onClick={() => navigate('/inicio')} disabled={cargandoProducto}>
                Cancelar
              </Boton>
            </Tarjeta>

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
