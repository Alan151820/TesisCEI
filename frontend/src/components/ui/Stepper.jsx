import './Stepper.css'

function Stepper({ pasos, pasoActivo, className = '' }) {
  return (
    <div className={`stepper${className ? ` ${className}` : ''}`}>
      {pasos.map((etiqueta, i) => {
        const numero = i + 1
        const activo = numero <= pasoActivo
        return (
          <div className="stepper-paso" key={etiqueta}>
            <span className={`stepper-num${activo ? ' stepper-num--activo' : ''}`}>{numero}</span>
            <span className="texto-mudo">{etiqueta}</span>
          </div>
        )
      })}
    </div>
  )
}

export default Stepper
