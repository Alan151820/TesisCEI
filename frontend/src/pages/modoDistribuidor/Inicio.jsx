import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { tokenValido } from '../../lib/auth'
import PanelDistribuidor from '../../components/PanelDistribuidor'
import './Inicio.css'

function Inicio() {
  const navigate = useNavigate()

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorVisibilidad, setErrorVisibilidad] = useState({})
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroVisibilidad, setFiltroVisibilidad] = useState('')
  const [filtroStock, setFiltroStock] = useState('')

  // --- Descuento total del catálogo (reemplaza al descuento por producto
  // individual que vivía en la ficha de edición) ---
  const [descuentoAbierto, setDescuentoAbierto] = useState(false)
  const [descuentoPct, setDescuentoPct] = useState('')
  const [aplicandoDescuento, setAplicandoDescuento] = useState(false)
  const [errorDescuento, setErrorDescuento] = useState('')
  const [mensajeDescuento, setMensajeDescuento] = useState('')

  useEffect(() => { if (!tokenValido()) navigate('/login') }, [navigate])

  const cargarProductos = async (categoria = '', visibilidad = '', stock = '') => {
    setCargando(true)
    try {
      const params = {}
      if (categoria) params.categoria = categoria
      if (visibilidad) params.visibilidad = visibilidad
      if (stock) params.stock = stock
      const res = await api.get('/api/productos', { params })
      setProductos(res.data)
    } catch {
      setProductos([])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarProductos()
    api.get('/api/productos/categorias')
      .then(res => setCategorias(res.data))
      .catch(() => {})
  }, [])

  const filtrarPorCategoria = (e) => {
    setFiltroCategoria(e.target.value)
    cargarProductos(e.target.value, filtroVisibilidad, filtroStock)
  }

  const filtrarPorVisibilidad = (e) => {
    setFiltroVisibilidad(e.target.value)
    cargarProductos(filtroCategoria, e.target.value, filtroStock)
  }

  const filtrarPorStock = (e) => {
    setFiltroStock(e.target.value)
    cargarProductos(filtroCategoria, filtroVisibilidad, e.target.value)
  }

  const limpiarFiltros = () => {
    setFiltroCategoria('')
    setFiltroVisibilidad('')
    setFiltroStock('')
    cargarProductos()
  }

  const handleCambiarVisibilidad = async (productoId, nuevoEstado) => {
    setErrorVisibilidad(prev => ({ ...prev, [productoId]: null }))
    try {
      const res = await api.patch(
        `/api/productos/${productoId}/visibilidad`,
        { nuevoEstado }
      )
      const productoActualizado = res.data.producto
      setProductos(prev =>
        prev.map(p =>
          p.id === productoId ? { ...p, estadoVisibilidad: productoActualizado.estadoVisibilidad } : p
        )
      )
    } catch (err) {
      const mensaje = err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.'
      setErrorVisibilidad(prev => ({ ...prev, [productoId]: mensaje }))
    }
  }

  const toggleDescuento = () => {
    setDescuentoAbierto(v => !v)
    setDescuentoPct('')
    setErrorDescuento('')
    setMensajeDescuento('')
  }

  // El descuento se aplica a los mismos productos que se ven en pantalla
  // (respeta categoría/visibilidad/stock filtrados) — mismo criterio de
  // filtrado que usa la lista, resuelto en el backend en una sola consulta.
  const handleAplicarDescuento = async () => {
    setErrorDescuento('')
    setMensajeDescuento('')
    const porcentaje = Number(descuentoPct)
    if (!descuentoPct || !porcentaje || porcentaje <= 0) {
      setErrorDescuento('Ingresá un porcentaje de descuento mayor a cero.')
      return
    }
    if (porcentaje >= 100) {
      setErrorDescuento('El descuento total debe ser menor a 100%.')
      return
    }
    setAplicandoDescuento(true)
    try {
      const res = await api.post('/api/productos/descuento-total', {
        porcentaje,
        categoria: filtroCategoria,
        visibilidad: filtroVisibilidad,
        stock: filtroStock,
      })
      setMensajeDescuento(res.data.mensaje)
      setDescuentoPct('')
      await cargarProductos(filtroCategoria, filtroVisibilidad, filtroStock)
    } catch (err) {
      setErrorDescuento(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setAplicandoDescuento(false)
    }
  }

  const factorPreview = descuentoPct && Number(descuentoPct) > 0 && Number(descuentoPct) < 100
    ? 1 - Number(descuentoPct) / 100
    : null

  return (
    <PanelDistribuidor
      tituloMobile="Mis productos"
      accionMobile={<button className="panel-mobile-nuevo" onClick={() => navigate('/producto/nuevo')}>+</button>}
    >
          <div className="panel-seccion-header">
            <div>
              <h1 className="panel-h1">Mis productos</h1>
              <p className="panel-subtitulo">Gestioná el catálogo de tu distribuidora.</p>
            </div>
            <button className="panel-btn-nuevo" onClick={() => navigate('/producto/nuevo')}>
              + Nuevo producto
            </button>
          </div>

          <div className="panel-filtros">
            <select className="panel-filtro-chip" value={filtroCategoria} onChange={filtrarPorCategoria}>
              <option value=''>Categoría</option>
              {categorias.map(c => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>

            <select className="panel-filtro-chip" value={filtroVisibilidad} onChange={filtrarPorVisibilidad}>
              <option value=''>Visibilidad</option>
              <option value='publicado'>Publicado</option>
              <option value='pausado'>Pausado</option>
            </select>

            <select className="panel-filtro-chip" value={filtroStock} onChange={filtrarPorStock}>
              <option value=''>Stock</option>
              <option value='con_stock'>Con stock</option>
              <option value='sin_stock'>Sin stock</option>
            </select>

            <div className="panel-filtro-limpiar" onClick={limpiarFiltros}>Limpiar filtros</div>

            <button
              className={`panel-btn-descuento${descuentoAbierto ? ' activo' : ''}`}
              onClick={toggleDescuento}
            >
              Aplicar descuento total
            </button>
          </div>

          {descuentoAbierto && (
            <div className="panel-descuento-card">
              <div className="panel-descuento-fila">
                <input
                  type="number"
                  className="panel-descuento-input"
                  min="1"
                  max="99"
                  placeholder="Ej: 10"
                  value={descuentoPct}
                  onChange={e => setDescuentoPct(e.target.value)}
                />
                <span className="panel-descuento-ayuda">
                  % sobre {productos.length} producto{productos.length !== 1 ? 's' : ''} {filtroCategoria || filtroVisibilidad || filtroStock ? 'filtrado' + (productos.length !== 1 ? 's' : '') : 'del catálogo'}
                </span>
                <button className="panel-btn-nuevo" onClick={handleAplicarDescuento} disabled={aplicandoDescuento}>
                  {aplicandoDescuento ? 'Aplicando…' : 'Aplicar'}
                </button>
              </div>

              {errorDescuento && <div className="panel-descuento-error">{errorDescuento}</div>}
              {mensajeDescuento && <div className="panel-descuento-ok">✓ {mensajeDescuento} Los precios ya quedaron guardados.</div>}

              {factorPreview && productos.length > 0 && (
                <div className="panel-descuento-preview">
                  <div className="panel-descuento-preview-aviso">
                    Vista previa — todavía no se guardó nada. Apretá "Aplicar" para confirmar estos precios.
                  </div>
                  <div className="panel-descuento-preview-header">
                    <div>Producto</div>
                    <div>Precio actual</div>
                    <div>Precio si aplicás ahora</div>
                  </div>
                  {productos.map(p => (
                    <div key={p.id} className="panel-descuento-preview-fila">
                      <div>{p.nombre}</div>
                      <div>{p.precioMinimo != null ? `$${Number(p.precioMinimo).toLocaleString('es-AR')}` : '—'}</div>
                      <div className="panel-descuento-preview-nuevo">
                        {p.precioMinimo != null ? `$${(Number(p.precioMinimo) * factorPreview).toLocaleString('es-AR', { maximumFractionDigits: 2 })}` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="panel-tabla-wrapper">
            <div className="panel-tabla-header">
              <div></div>
              <div>Producto</div>
              <div>Categoría</div>
              <div>Stock disp.</div>
              <div>Stock res.</div>
              <div>Estado</div>
              <div>Acciones</div>
            </div>

            {cargando && (
              <div className="panel-tabla-vacio">Cargando productos...</div>
            )}

            {!cargando && productos.length === 0 && (
              <div className="panel-tabla-vacio">
                {filtroCategoria || filtroVisibilidad || filtroStock
                  ? 'No hay productos que coincidan con los filtros aplicados.'
                  : <>Aún no tenés productos. Creá el primero con el botón{' '}
                    <span className="panel-tabla-vacio-link" onClick={() => navigate('/producto/nuevo')}>
                      + Nuevo producto
                    </span>.</>
                }
              </div>
            )}

            {!cargando && productos.map(p => (
              <div key={p.id}>
                <div className="panel-tabla-fila">
                  <div className="panel-tabla-celda">
                    {p.imagenUrl
                      ? <img src={`http://localhost:3000${p.imagenUrl}`} alt={p.nombre} className="panel-producto-foto-img" />
                      : <div className="panel-producto-foto">—</div>
                    }
                  </div>
                  <div className="panel-tabla-celda">{p.nombre}</div>
                  <div className="panel-tabla-celda">{p.categoria}</div>
                  <div className={`panel-tabla-celda${p.stockDisponible === 0 ? ' stock-cero' : ''}`}>
                    {p.stockDisponible === 0 ? 'Sin stock disponible.' : `${p.stockDisponible} u.`}
                  </div>
                  <div className="panel-tabla-celda">{p.stockReservado} u.</div>
                  <div className="panel-tabla-celda">
                    <span className={`panel-estado-badge ${p.estadoVisibilidad}`}>
                      {p.estadoVisibilidad === 'publicado' ? 'Publicado' : 'Pausado'}
                    </span>
                  </div>
                  <div className="panel-tabla-celda panel-acciones">
                    {p.estadoVisibilidad === 'publicado' ? (
                      <span className="panel-accion-link" onClick={() => handleCambiarVisibilidad(p.id, 'pausado')}>Pausar</span>
                    ) : (
                      <span className="panel-accion-link" onClick={() => handleCambiarVisibilidad(p.id, 'publicado')}>Publicar</span>
                    )}
                    {' · '}
                    <span className="panel-accion-link" onClick={() => navigate(`/producto/editar/${p.id}`)}>Editar</span>
                  </div>
                </div>

                <div className="panel-lista-fila">
                  <div className="panel-lista-foto">
                    {p.imagenUrl
                      ? <img src={`http://localhost:3000${p.imagenUrl}`} alt={p.nombre} className="panel-lista-foto-img" />
                      : '—'
                    }
                  </div>
                  <div className="panel-lista-info">
                    <div className="panel-lista-nombre">{p.nombre}</div>
                    <div className="panel-lista-stock">Stock: {p.stockDisponible} u.</div>
                  </div>
                  <div className="panel-lista-derecha">
                    <span
                      className={`panel-estado-badge ${p.estadoVisibilidad} panel-lista-toggle`}
                      onClick={() => handleCambiarVisibilidad(
                        p.id,
                        p.estadoVisibilidad === 'publicado' ? 'pausado' : 'publicado'
                      )}
                    >
                      {p.estadoVisibilidad === 'publicado' ? 'Publicado' : 'Pausado'}
                    </span>
                    <span className="panel-lista-editar" onClick={() => navigate(`/producto/editar/${p.id}`)}>Editar</span>
                  </div>
                </div>

                {errorVisibilidad[p.id] && (
                  <div className="panel-error-visibilidad">{errorVisibilidad[p.id]}</div>
                )}
              </div>
            ))}
          </div>

          {!cargando && productos.length > 0 && (
            <div className="panel-tabla-contador">
              Mostrando {productos.length} producto{productos.length !== 1 ? 's' : ''}
            </div>
          )}
    </PanelDistribuidor>
  )
}

export default Inicio