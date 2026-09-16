function ModalBody({ children, className = '' }) {
  return <div className={`modal-body${className ? ` ${className}` : ''}`}>{children}</div>
}

export default ModalBody
