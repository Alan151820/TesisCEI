import './Hdr.css'

function Hdr({ menuBoton, logo, buscador = false, buscadorValor, onBuscadorChange, buscadorPlaceholder = 'Buscar productos…', children, className = '' }) {
  return (
    <div className={`hdr${className ? ` ${className}` : ''}`}>
      {menuBoton}
      {logo}
      {buscador && (
        <div className="hdr-buscador">
          <span className="hdr-buscador-icono">⌕</span>
          <input
            type="text"
            value={buscadorValor}
            onChange={(e) => onBuscadorChange?.(e.target.value)}
            placeholder={buscadorPlaceholder}
          />
        </div>
      )}
      <div className="hdr-acciones">{children}</div>
    </div>
  )
}

export default Hdr
