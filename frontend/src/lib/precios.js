function precioAplicable(tarifas, cantidad) {
  if (!tarifas || tarifas.length === 0) return null
  const aplicables = tarifas.filter(t => Number(t.cantidadMinima) <= Number(cantidad))
  if (aplicables.length === 0) {
    return Number(tarifas.reduce((min, t) => Number(t.cantidadMinima) < Number(min.cantidadMinima) ? t : min).precioVenta)
  }
  return Number(
    aplicables.reduce((mejor, t) => Number(t.cantidadMinima) > Number(mejor.cantidadMinima) ? t : mejor).precioVenta
  )
}

export { precioAplicable }
