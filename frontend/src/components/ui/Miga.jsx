import { Link } from 'react-router-dom'
import './Miga.css'

function Miga({ items, className = '' }) {
  return (
    <div className={`miga texto-mudo${className ? ` ${className}` : ''}`}>
      {items.map((item, i) => (
        <span key={i}>
          {item.to ? <Link to={item.to} className="link">{item.etiqueta}</Link> : <span>{item.etiqueta}</span>}
          {i < items.length - 1 && <span className="miga-sep"> › </span>}
        </span>
      ))}
    </div>
  )
}

export default Miga
