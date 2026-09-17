function TablaHeader({ columnas, className = '' }) {
  return (
    <div className={`tabla-header${className ? ` ${className}` : ''}`} role="row">
      {columnas.map((c, i) => {
        const { label, className: colClass } = typeof c === 'string' ? { label: c, className: '' } : c
        return <div key={i} className={colClass || undefined} role="columnheader">{label}</div>
      })}
    </div>
  )
}

export default TablaHeader
