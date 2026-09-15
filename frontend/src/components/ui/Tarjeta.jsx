import './Tarjeta.css'

function Tarjeta({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`tarjeta${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </Tag>
  )
}

export default Tarjeta
