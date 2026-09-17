import Boton from './Boton'

function ModalHeader({ titulo, onCerrar }) {
  return (
    <div className="modal-header">
      <span className="modal-titulo">{titulo}</span>
      <Boton variante="icono" onClick={onCerrar} aria-label="Cerrar">✕</Boton>
    </div>
  )
}

export default ModalHeader
