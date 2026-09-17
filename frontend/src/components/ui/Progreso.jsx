import './Progreso.css'

function Progreso({ porcentaje = 0, className = '', style }) {
  const pct = Math.max(0, Math.min(100, porcentaje))
  return (
    <div
      className={`progreso${className ? ` ${className}` : ''}`}
      style={style}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className="progreso-relleno" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default Progreso
