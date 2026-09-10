function FormularioTramoPrecio({
  cantidadMinima,
  descuentoPct,
  precioVenta,
  precioPorUnidadCalc,
  onCantidad,
  onDescuento,
  onPrecio,
  onGuardar,
  onCancelar,
  textoGuardar,
  error,
  cargando = false,
}) {
  return (
    <div className="ficha-form-precio">
      <div className="ficha-fila-tres">
        <div className="ficha-campo">
          <label className="ficha-label">Cantidad (desde) <span className="ficha-requerido">*</span></label>
          <input
            type="number"
            className="ficha-input"
            min="1"
            step="1"
            placeholder="Ej: 10"
            value={cantidadMinima}
            onChange={e => onCantidad(e.target.value)}
          />
          <span className="ficha-ayuda">Aplica a partir de esa cantidad de unidades.</span>
        </div>
        <div className="ficha-campo">
          <label className="ficha-label">Descuento %</label>
          <input
            type="number"
            className="ficha-input"
            min="0"
            max="99"
            step="1"
            placeholder="Ej: 12"
            value={descuentoPct}
            onChange={e => onDescuento(e.target.value)}
          />
          <span className="ficha-ayuda">Sobre el precio base.</span>
        </div>
        <div className="ficha-campo">
          <label className="ficha-label">Precio total <span className="ficha-requerido">*</span></label>
          <input
            type="number"
            className="ficha-input"
            min="0.01"
            step="0.01"
            placeholder="Ej: 8100.00"
            value={precioVenta}
            onChange={e => onPrecio(e.target.value)}
          />
        </div>
      </div>
      <div className="ficha-campo">
        <label className="ficha-label">Precio por unidad</label>
        <input
          type="text"
          className="ficha-input ficha-input-solo-lectura ficha-input-angosto"
          readOnly
          value={precioPorUnidadCalc != null ? `$${precioPorUnidadCalc.toFixed(2)}` : '—'}
        />
      </div>
      {error && <div className="ficha-error">{error}</div>}
      <div className="ficha-form-precio-acciones">
        <button className="ficha-btn-guardar" onClick={onGuardar} disabled={cargando}>
          {cargando ? 'Guardando…' : textoGuardar}
        </button>
        <button className="ficha-btn-cancelar" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default FormularioTramoPrecio
