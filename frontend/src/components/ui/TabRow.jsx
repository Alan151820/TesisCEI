import './TabRow.css'

function TabRow({ tabs, activo, onCambiar, className = '' }) {
  return (
    <div className={`tab-row${className ? ` ${className}` : ''}`}>
      {tabs.map(t => (
        <div
          key={t.valor}
          className={`tab${t.valor === activo ? ' tab--activo' : ''}`}
          onClick={() => onCambiar?.(t.valor)}
        >
          {t.etiqueta}
        </div>
      ))}
    </div>
  )
}

export default TabRow
