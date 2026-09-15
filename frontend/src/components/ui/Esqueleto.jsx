import './Esqueleto.css'

function Esqueleto({ width, height = 16, className = '', style }) {
  return (
    <span
      className={`esqueleto${className ? ` ${className}` : ''}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  )
}

export default Esqueleto
