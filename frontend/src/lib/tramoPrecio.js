
export function totalDesdeDescuento(precioBase, cantidad, descuentoPct) {
  return (Number(precioBase) * (1 - Number(descuentoPct) / 100) * Number(cantidad)).toFixed(2)
}

export function descuentoDesdeTotal(precioBase, cantidad, precioTotal) {
  const base = Number(precioBase)
  if (!(base > 0)) return 0
  const porUnidad = Number(precioTotal) / Number(cantidad)
  return Math.round((1 - porUnidad / base) * 100)
}

export function precioUnitario(precioTotal, cantidad) {
  const cant = Number(cantidad)
  if (!precioTotal || !cant || cant <= 0) return null
  return Number(precioTotal) / cant
}
