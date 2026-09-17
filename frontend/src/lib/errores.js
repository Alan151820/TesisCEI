const FALLBACK = 'No fue posible completar la operación. Intente nuevamente más tarde.'

export function mensajeDeError(err, fallback = FALLBACK) {
  const data = err?.response?.data
  return (data?.error || data?.mensaje) || fallback
}
