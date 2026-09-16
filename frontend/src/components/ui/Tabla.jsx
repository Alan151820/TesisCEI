import './Tabla.css'

function Tabla({ children, grid, className = '' }) {
  const style = grid ? { '--tabla-cols': grid } : undefined
  return (
    <div className={`tabla${className ? ` ${className}` : ''}`} style={style} role="table">
      {children}
    </div>
  )
}

export default Tabla
