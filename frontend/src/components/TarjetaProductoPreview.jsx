import { construirTituloProducto } from '../lib/producto'
import Boton from './ui/Boton'
import './ui/CardProducto.css'

function TarjetaProductoPreview({ nombre, marca, magnitudValor, magnitudUnidad, categoriaNombre, descripcion, imagenSrc, nombreDistribuidor, precioMinimo, precioBase }) {
  const tieneNombre = nombre && nombre.trim() !== ''
  const tienePrecio = Number(precioMinimo) > 0
  const titulo = tieneNombre ? construirTituloProducto({ nombre, marca, magnitudValor, magnitudUnidad }) : 'Nombre del producto'

  return (
    <div className="card-producto">
      {imagenSrc
        ? <img src={imagenSrc} alt={nombre || 'Producto'} className="card-producto-imagen" />
        : <div className="placeholder-img card-producto-imagen">Sin imagen</div>
      }
      <div className="card-producto-info col gap-s">
        <span className="texto-mudo">{categoriaNombre || 'Categoría'}</span>
        <span className="titulo1">{titulo}</span>
        {descripcion && <span className="texto-mudo">{descripcion}</span>}
        <span className="texto-mudo">{nombreDistribuidor || 'Tu distribuidora'}</span>
        <span className="texto">
          {tienePrecio ? (
            <>
              Desde ${Number(precioMinimo).toLocaleString('es-AR')}
              {Number(precioBase) > Number(precioMinimo) && (
                <span className="texto-mudo"> hasta ${Number(precioBase).toLocaleString('es-AR')}</span>
              )}
            </>
          ) : 'Desde $—'}
        </span>
        <Boton variante="fill" style={{ width: '100%' }}>+ Agregar</Boton>
      </div>
    </div>
  )
}

export default TarjetaProductoPreview
