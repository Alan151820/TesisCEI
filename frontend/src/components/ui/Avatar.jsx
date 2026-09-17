import './Avatar.css'

function iniciales(nombre = '') {
  return nombre.trim().split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function Avatar({ nombre = '', onClick, className = '', ...props }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`avatar${className ? ` ${className}` : ''}`}
      onClick={onClick}
      {...props}
    >
      {iniciales(nombre)}
    </Tag>
  )
}

export default Avatar
export { iniciales }
