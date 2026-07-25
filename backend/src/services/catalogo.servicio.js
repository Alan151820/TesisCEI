const pool = require('../config/db')

async function listarCatalogo(nombre = '', categoria = '', distribuidor = '', precioMinimo = null, precioMaximo = null) {
  let condiciones = [`p.estado_visibilidad = 'publicado'`, `p.habilitado = true`]
  let having = []
  const params = []
  let contador = 1

  if (nombre) {
    params.push(`%${nombre}%`)
    condiciones.push(`p.nombre ILIKE $${contador++}`)
  }

  if (categoria) {
    params.push(categoria)
    condiciones.push(`c.nombre = $${contador++}`)
  }

  if (distribuidor) {
    params.push(`%${distribuidor}%`)
    condiciones.push(`d.nombre_comercial ILIKE $${contador++}`)
  }

  if (precioMinimo) {
    params.push(precioMinimo)
    having.push(`MIN(pv.precio_venta) >= $${contador++}`)
  }

  if (precioMaximo) {
    params.push(precioMaximo)
    having.push(`MIN(pv.precio_venta) <= $${contador++}`)
  }

  const where = condiciones.join(' AND ')
  const havingClause = having.length > 0 ? `HAVING ${having.join(' AND ')}` : ''

  const resultado = await pool.query(
    `SELECT
       p.id,
       p.nombre,
       p.descripcion,
       p.imagen_url AS "imagenUrl",
       c.nombre AS categoria,
       d.nombre_comercial AS "nombreDistribuidor",
       d.id AS "distribuidorId",
       MIN(pv.precio_venta) AS "precioMinimo"
     FROM producto p
     JOIN categoria c ON c.id = p.categoria_id
     JOIN distribuidor d ON d.id = p.distribuidor_id
     JOIN precio_volumen pv ON pv.producto_id = p.id
     WHERE ${where}
     GROUP BY p.id, p.nombre, p.descripcion, p.imagen_url, c.nombre, d.nombre_comercial, d.id
     ${havingClause}
     ORDER BY p.fecha_creacion DESC`,
    params
  )
  return resultado.rows
}

module.exports = { listarCatalogo }
