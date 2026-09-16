import './GridCards.css'

function GridCards({ children, className = '' }) {
  return <div className={`grid-cards${className ? ` ${className}` : ''}`}>{children}</div>
}

export default GridCards
