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
