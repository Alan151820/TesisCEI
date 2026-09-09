// Toma lo que el usuario escribió en el campo de teléfono (con o sin
// espacios, guiones, el 0 inicial) y lo devuelve en el formato E.164
// uruguayo que espera el backend: +598 seguido del número sin el 0.
// El backend valida el largo final (RF-009).
export function formatearTelefonoUy(valor) {
  let numeros = valor.replace(/\D/g, '')
  if (numeros.startsWith('0')) {
    numeros = numeros.substring(1)
  }
  return '+598' + numeros
}
