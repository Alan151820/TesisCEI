function TablaFila({ children, onClick, className = '' }) {
  return (
    <div
      className={`tabla-fila${onClick ? ' tabla-fila--clickeable' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      role="row"
    >
      {children}
    </div>
  )
}

export default TablaFila
