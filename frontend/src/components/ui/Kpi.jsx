import './Kpi.css'

function Kpi({ etiqueta, valor }) {
  return (
    <div className="kpi">
      <span className="texto-mudo">{etiqueta}</span>
      <div className="kpi-num">{valor}</div>
    </div>
  )
}

export default Kpi
