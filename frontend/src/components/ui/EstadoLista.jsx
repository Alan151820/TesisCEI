import './EstadoLista.css'

function EstadoLista({ variante, className = '', children }) {
  const clase = `estado-lista${variante ? ` estado-lista--${variante}` : ''}${className ? ` ${className}` : ''}`
  return <div className={clase}>{children}</div>
}

export default EstadoLista
