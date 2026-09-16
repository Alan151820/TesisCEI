export function formatearTelefonoUy(valor) {
  let numeros = valor.replace(/\D/g, '')
  if (numeros.startsWith('0')) {
    numeros = numeros.substring(1)
  }
  return '+598' + numeros
}
