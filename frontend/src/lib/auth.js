// atob() decodifica base64 estándar (+ /), pero el payload de un JWT viene
// en base64url (- _ y sin padding) — un nombre con ciertos caracteres puede
// producir "-"/"_" en el payload codificado y atob() lanza. Se convierte a
// base64 estándar y se repone el padding antes de decodificar.
function decodificarToken(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return JSON.parse(atob(padded))
}

export function tokenValido() {
  const token = localStorage.getItem('token')
  if (!token) return false
  try {
    const payload = decodificarToken(token)
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function rutaInicio() {
  return tokenValido() ? '/inicioComprador' : '/catalogo'
}

// RF-047: borra las claves de sesión y avisa al resto de la app (el
// carrito, la campana y el header escuchan 'auth-changed') para que se
// refresquen sin recargar. No navega: de eso se encarga cada lugar que la
// llama, según a dónde corresponda mandar al usuario.
export function cerrarSesion() {
  localStorage.removeItem('token')
  localStorage.removeItem('nombre')
  localStorage.removeItem('telefono')
  localStorage.removeItem('modoDistribuidorActivo')
  window.dispatchEvent(new Event('auth-changed'))
}

export { decodificarToken }
