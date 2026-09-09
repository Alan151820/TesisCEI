const FALLBACK = 'No fue posible completar la operación. Intente nuevamente más tarde.'

// Saca el mensaje que mandó el backend en un error de axios. El backend
// usa `{ error }` en casi todo (ver el handler global de app.js) y `{ mensaje }`
// en auth y en el detalle de catálogo — se contemplan los dos. Si no vino
// ninguno, o vino vacío, se usa el texto genérico.
export function mensajeDeError(err, fallback = FALLBACK) {
  const data = err?.response?.data
  return (data?.error || data?.mensaje) || fallback
}
