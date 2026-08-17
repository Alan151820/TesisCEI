import { ETIQUETA_ESTADO } from '../lib/pedido'
import './EstadoBadge.css'

function EstadoBadge({ estado, className = '' }) {
  return (
    <span className={`estado-badge estado-badge--${estado}${className ? ` ${className}` : ''}`}>
      {ETIQUETA_ESTADO[estado] ?? estado}
    </span>
  )
}

export default EstadoBadge
