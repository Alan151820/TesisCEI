import './Modal.css'

function Modal({ children, onCerrar, className = '' }) {
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className={`modal${className ? ` ${className}` : ''}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default Modal
