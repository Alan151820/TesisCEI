import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './FichaProducto.css'

function FichaProducto() {
  const navigate = useNavigate()

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
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    axios.get('http://localhost:3000/api/productos/categorias')
      .then(res => setCategorias(res.data))
      .catch(() => setError('No se pudieron cargar las categorías.'))
  }, [])

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

  const handleGuardar = async () => {
    setError('')
    setCargando(true)
    const token = localStorage.getItem('token')
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

      await axios.post('http://localhost:3000/api/productos', formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      navigate('/inicio')
    } catch (err) {
      setError(err.response?.data?.error || 'No fue posible completar la operación. Intente nuevamente más tarde.')
    } finally {
      setCargando(false)
    }
  }

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
                      <select
                        className="ficha-select"
                        value={categoriaId}
                        onChange={e => setCategoriaId(e.target.value)}
                      >
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
                          <input
                            type="radio"
                            name="tipo"
                            value="empaquetado"
                            checked={tipo === 'empaquetado'}
                            onChange={() => handleTipoChange('empaquetado')}
                          />
                          Empaquetado
                        </label>
                        <label className="ficha-radio-label">
                          <input
                            type="radio"
                            name="tipo"
                            value="fraccionable"
                            checked={tipo === 'fraccionable'}
                            onChange={() => handleTipoChange('fraccionable')}
                          />
                          Fraccionable
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ficha-campo">
                <label className="ficha-label">Descripción</label>
                <textarea
                  className="ficha-textarea"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Descripción del producto"
                />
              </div>

              {tipo === 'empaquetado' && (
                <div className="ficha-fila-dos">
                  <div className="ficha-campo">
                    <label className="ficha-label">Descripción de la unidad de venta</label>
                    <input
                      type="text"
                      className="ficha-input"
                      value={descripcionUnidadVenta}
                      onChange={e => setDescripcionUnidadVenta(e.target.value)}
                      placeholder="Ej: Bloque de 1kg"
                    />
                    <span className="ficha-ayuda">Solo para productos Empaquetados</span>
                  </div>
                  <div className="ficha-campo">
                    <label className="ficha-label">Cantidad mínima de compra <span className="ficha-requerido">*</span></label>
                    <input
                      type="number"
                      className="ficha-input"
                      min="1"
                      value={cantidadMinimaCompra}
                      onChange={e => setCantidadMinimaCompra(e.target.value)}
                      placeholder="En unidades"
                    />
                    <span className="ficha-ayuda">En unidades (Empaquetado)</span>
                  </div>
                </div>
              )}

              {tipo === 'fraccionable' && (
                <>
                  <div className="ficha-fila-tres">
                    <div className="ficha-campo">
                      <label className="ficha-label">Unidad base interna <span className="ficha-requerido">*</span></label>
                      <select
                        className="ficha-select"
                        value={unidadBaseInterna}
                        onChange={e => setUnidadBaseInterna(e.target.value)}
                      >
                        <option value="">Seleccioná</option>
                        <option value="gramo">Gramo</option>
                        <option value="mililitro">Mililitro</option>
                        <option value="centimetro">Centímetro</option>
                      </select>
                    </div>
                    <div className="ficha-campo">
                      <label className="ficha-label">Incremento de venta <span className="ficha-requerido">*</span></label>
                      <input
                        type="number"
                        className="ficha-input"
                        min="0.01"
                        step="0.01"
                        value={incrementoVenta}
                        onChange={e => setIncrementoVenta(e.target.value)}
                        placeholder="Ej: 0.5"
                      />
                    </div>
                    <div className="ficha-campo">
                      <label className="ficha-label">Métrica de visualización <span className="ficha-requerido">*</span></label>
                      <select
                        className="ficha-select"
                        value={metricaVisualizacion}
                        onChange={e => setMetricaVisualizacion(e.target.value)}
                      >
                        <option value="">Seleccioná</option>
                        <option value="kilogramos">Kilogramos</option>
                        <option value="litros">Litros</option>
                        <option value="metros">Metros</option>
                      </select>
                    </div>
                  </div>
                  <div className="ficha-campo">
                    <label className="ficha-label">Cantidad mínima de compra <span className="ficha-requerido">*</span></label>
                    <input
                      type="number"
                      className="ficha-input"
                      min="0.01"
                      step="0.01"
                      value={cantidadMinimaCompra}
                      onChange={e => setCantidadMinimaCompra(e.target.value)}
                      placeholder="En unidad de visualización"
                    />
                    <span className="ficha-ayuda">En la unidad de visualización seleccionada</span>
                  </div>
                </>
              )}

              <div className="ficha-campo">
                <label className="ficha-label">Stock inicial <span className="ficha-requerido">*</span></label>
                <input
                  type="number"
                  className="ficha-input ficha-input-angosto"
                  min="0"
                  value={stockInicial}
                  onChange={e => setStockInicial(e.target.value)}
                  placeholder="0"
                />
                <span className="ficha-ayuda">No puede reducirse por debajo del stock reservado.</span>
              </div>

              {error && <div className="ficha-error">{error}</div>}
            </div>

          </div>

          <div className="ficha-sidebar">
            <div className="ficha-card ficha-card-estado">
              <div className="ficha-sidebar-titulo">Estado</div>
              <div className="ficha-estado-texto">Pausado</div>
              <span className="ficha-estado-nota">El producto se crea pausado. Publicalo una vez que tenga precios.</span>
            </div>
            <div className="ficha-card">
              <button
                className="ficha-btn-guardar"
                onClick={handleGuardar}
                disabled={cargando}
              >
                {cargando ? 'Guardando…' : 'Guardar producto'}
              </button>
              <button
                className="ficha-btn-cancelar"
                onClick={() => navigate('/inicio')}
                disabled={cargando}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default FichaProducto
