// Un id que viene en la URL (`req.params`) es siempre string. Antes de
// pasarlo a una consulta, `Number(...)` puede dar NaN o un decimal, y
// cualquiera de los dos, al llegar a un `WHERE id = $1` sobre una columna
// integer, hace que Postgres responda con un error crudo (500) en vez de
// un 404. Este chequeo — repetido en catalogo, distribuidor, notificaciones,
// pedidos y reparto — vive acá una sola vez.
export function esIdValido(valor) {
  return Number.isInteger(valor) && valor > 0
}
