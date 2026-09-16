import { Link } from 'react-router-dom'
import './Boton.css'

function Boton({ variante = 'fill', to, href, badge, className = '', type = 'button', children, ...props }) {
  const clase = `btn btn--${variante}${className ? ` ${className}` : ''}`
  const contenido = (
    <>
      {children}
      {badge != null && badge > 0 && <span className="badge-num">{badge}</span>}
    </>
  )

  if (to) return <Link to={to} className={clase} {...props}>{contenido}</Link>
  if (href) return <a href={href} className={clase} {...props}>{contenido}</a>
  return <button type={type} className={clase} {...props}>{contenido}</button>
}

export default Boton
