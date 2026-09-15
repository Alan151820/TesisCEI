import { construirTituloProducto } from '../../lib/producto'
import Boton from './Boton'
import './CardProducto.css'

function CardProducto({ producto, onClick, onAgregar, compacta = false }) {
  const precioMinimo = Number(producto.precioMinimo)
  const precioBase = Number(producto.precioBase)

  return (
    <div className="card-producto" onClick={onClick}>
      {producto.imagenUrl
        ? <img src={`http://localhost:3000${producto.imagenUrl}`} alt={producto.nombre} className="card-producto-imagen" />
        : <div className="placeholder-img card-producto-imagen">Sin imagen</div>
      }
      <div className="card-producto-info col gap-s">
        <span className="texto-mudo">{producto.categoria}</span>
        <span className="titulo1">{construirTituloProducto(producto)}</span>
        {producto.descripcion && <span className="texto-mudo">{producto.descripcion}</span>}
        {!compacta && (
          <>
            <span className="texto-mudo">{producto.nombreDistribuidor}</span>
            <span className="texto">
              Desde ${precioMinimo.toLocaleString('es-AR')}
              {precioBase > precioMinimo && <span className="texto-mudo"> hasta ${precioBase.toLocaleString('es-AR')}</span>}
            </span>
            {onAgregar && (
              <Boton variante="fill" style={{ width: '100%' }} onClick={(e) => { e.stopPropagation(); onAgregar(producto) }}>
                + Agregar
              </Boton>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CardProducto
