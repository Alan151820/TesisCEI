import { construirTituloProducto } from '../lib/producto'
import './TarjetaProductoPreview.css'

// Espejo visual de la tarjeta del catálogo público (Catalogo.jsx). Se usa en
// FichaProducto.jsx y EditarProducto.jsx para previsualizar en vivo cómo se
// va a ver el producto mientras se edita, antes de guardar. No es interactiva
// (no navega, no agrega al carrito) — es solo una vista previa.
function TarjetaProductoPreview({ nombre, marca, magnitudValor, magnitudUnidad, categoriaNombre, descripcion, imagenSrc, nombreDistribuidor, precioMinimo, precioBase }) {
  const tieneNombre = nombre && nombre.trim() !== ''
  const tienePrecio = Number(precioMinimo) > 0
  const titulo = tieneNombre ? construirTituloProducto({ nombre, marca, magnitudValor, magnitudUnidad }) : 'Nombre del producto'

  return (
    <div className="preview-tarjeta">
      {imagenSrc
        ? <img src={imagenSrc} alt={nombre || 'Producto'} className="preview-tarjeta-imagen" />
        : <div className="preview-tarjeta-imagen-placeholder">Sin imagen</div>
      }
      <div className="preview-tarjeta-cuerpo">
        <div className="preview-tarjeta-categoria">{categoriaNombre || 'Categoría'}</div>
        <div className="preview-tarjeta-nombre">{titulo}</div>
        {descripcion && <div className="preview-tarjeta-descripcion">{descripcion}</div>}
        <div className="preview-tarjeta-pie">
          <div className="preview-tarjeta-distribuidor">{nombreDistribuidor || 'Tu distribuidora'}</div>
          <div className="preview-tarjeta-precio">
            {tienePrecio ? (
              <>
                <div>Desde ${Number(precioMinimo).toLocaleString('es-AR')}</div>
                {Number(precioBase) > Number(precioMinimo) && (
                  <div className="preview-tarjeta-precio-hasta">Hasta ${Number(precioBase).toLocaleString('es-AR')}</div>
                )}
              </>
            ) : <div>Desde $—</div>}
          </div>
        </div>
        <div className="preview-tarjeta-agregar">+ Agregar</div>
      </div>
    </div>
  )
}

export default TarjetaProductoPreview
