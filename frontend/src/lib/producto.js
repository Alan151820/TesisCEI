const UNIDADES_MAGNITUD = { kg: 'kg', g: 'g', ml: 'ml', l: 'L', cm: 'cm', m: 'm' }

// Compone el título visible de un producto (nombre - marca peso/longitud),
// usado en el catálogo, el detalle de producto y su previsualización.
export function construirTituloProducto({ nombre, marca, magnitudValor, magnitudUnidad }) {
  const magnitudTxt = magnitudValor && magnitudUnidad
    ? `${Number(magnitudValor).toLocaleString('es-AR')} ${UNIDADES_MAGNITUD[magnitudUnidad] || ''}`
    : ''
  const resto = [marca, magnitudTxt].filter(Boolean).join(' ')
  if (!nombre) return resto
  return resto ? `${nombre} - ${resto}` : nombre
}

// Tramo de precio por volumen aplicable a una cantidad real — mismo
// criterio que usa el backend (Producto.obtenerPrecioVolumenAplicable): el
// tramo con la cantidad_minima más alta que no supere la cantidad.
export function resolverTramoPrecio(tarifas, cantidadReal) {
  const candidatos = (tarifas || []).filter(t => Number(t.cantidadMinima) <= cantidadReal)
  if (candidatos.length === 0) return null
  return candidatos.reduce((mejor, actual) => Number(actual.cantidadMinima) > Number(mejor.cantidadMinima) ? actual : mejor)
}
