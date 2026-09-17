function Marca({ variante, grande = false, className = '' }) {
  const clases = ['marca', variante && `marca--${variante}`, grande && 'marca--grande', className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={clases}>
      <svg className="marca-icono" viewBox="0 0 476 498" aria-hidden="true">
        <use href="#distria-logo" />
      </svg>
      <svg className="marca-texto" viewBox="0 0 1034 284" role="img" aria-label="Distria">
        <use href="#distria-titulo" />
      </svg>
    </span>
  )
}

export default Marca
