import './Paginacion.css'

function Paginacion({ paginaActual = 1, totalPaginas = 1, onCambiar, className = '' }) {
  if (totalPaginas <= 1) return null
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  return (
    <div className={`paginacion${className ? ` ${className}` : ''}`}>
      <span
        className="paginacion-pag"
        onClick={() => paginaActual > 1 && onCambiar?.(paginaActual - 1)}
        aria-disabled={paginaActual === 1}
      >
        ←
      </span>
      {paginas.map(p => (
        <span
          key={p}
          className={`paginacion-pag${p === paginaActual ? ' activo' : ''}`}
          onClick={() => onCambiar?.(p)}
        >
          {p}
        </span>
      ))}
      <span
        className="paginacion-pag"
        onClick={() => paginaActual < totalPaginas && onCambiar?.(paginaActual + 1)}
        aria-disabled={paginaActual === totalPaginas}
      >
        →
      </span>
    </div>
  )
}

export default Paginacion
