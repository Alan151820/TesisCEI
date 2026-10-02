import Campo from './ui/Campo'
import Boton from './ui/Boton'

function FormularioTramoPrecio({
  cantidadMinima,
  descuentoPct,
  precioVenta,
  precioPorUnidadCalc,
  precioCosto,
  onCantidad,
  onDescuento,
  onPrecio,
  onCosto,
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
          <Campo
            type="number"
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
          <Campo
            type="number"
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
          <Campo
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Ej: 8100.00"
            value={precioVenta}
            onChange={e => onPrecio(e.target.value)}
          />
        </div>
      </div>
      <div className="ficha-fila-dos">
        <div className="ficha-campo">
          <label className="ficha-label">Precio por unidad</label>
          <Campo
            type="text"
            className="ficha-input-solo-lectura ficha-input-angosto"
            readOnly
            value={precioPorUnidadCalc != null ? `$${precioPorUnidadCalc.toFixed(2)}` : '—'}
          />
        </div>
        <div className="ficha-campo">
          <label className="ficha-label">Costo por unidad <span className="ficha-ayuda-inline">opcional</span></label>
          <Campo
            type="number"
            className="ficha-input-angosto"
            min="0"
            step="0.01"
            placeholder="Opcional"
            value={precioCosto}
            onChange={e => onCosto(e.target.value)}
          />
          <span className="ficha-ayuda">Lo que te cuesta a vos cada unidad.</span>
        </div>
      </div>
      {error && <div className="ficha-error">{error}</div>}
      <div className="ficha-form-precio-acciones">
        <Boton onClick={onGuardar} disabled={cargando}>
          {cargando ? 'Guardando…' : textoGuardar}
        </Boton>
        <Boton variante="outline" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </Boton>
      </div>
    </div>
  )
}

export default FormularioTramoPrecio
