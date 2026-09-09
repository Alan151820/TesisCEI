// El formulario de un tramo de precio por volumen muestra tres magnitudes
// a la vez, todas relativas al precio base (cantidad 1): la cantidad
// mínima, el % de descuento y el precio total del tramo. Al cambiar
// cualquiera, hay que recalcular las otras. Estas funciones puras hacen
// esa conversión; se usan igual en el alta (FichaProducto) y en la
// edición (EditarProducto).

// Precio total del tramo, dado el % de descuento sobre el precio base.
export function totalDesdeDescuento(precioBase, cantidad, descuentoPct) {
  return (Number(precioBase) * (1 - Number(descuentoPct) / 100) * Number(cantidad)).toFixed(2)
}

// % de descuento (entero) que ese precio total representa frente al base.
export function descuentoDesdeTotal(precioBase, cantidad, precioTotal) {
  const base = Number(precioBase)
  if (!(base > 0)) return 0
  const porUnidad = Number(precioTotal) / Number(cantidad)
  return Math.round((1 - porUnidad / base) * 100)
}

// Precio por unidad a partir del precio total del tramo, o null si falta
// algún dato para calcularlo.
export function precioUnitario(precioTotal, cantidad) {
  const cant = Number(cantidad)
  if (!precioTotal || !cant || cant <= 0) return null
  return Number(precioTotal) / cant
}
