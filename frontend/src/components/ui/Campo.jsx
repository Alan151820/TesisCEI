import './Campo.css'

function Campo({ as = 'input', area = false, className = '', ...props }) {
  const Tag = area ? 'textarea' : as
  const clase = `campo${area ? ' campo--area' : ''}${className ? ` ${className}` : ''}`
  return <Tag className={clase} {...props} />
}

export default Campo
