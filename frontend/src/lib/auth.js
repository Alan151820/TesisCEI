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

export function cerrarSesion() {
  localStorage.removeItem('token')
  localStorage.removeItem('nombre')
  localStorage.removeItem('telefono')
  localStorage.removeItem('modoDistribuidorActivo')
  window.dispatchEvent(new Event('auth-changed'))
}

export { decodificarToken }
