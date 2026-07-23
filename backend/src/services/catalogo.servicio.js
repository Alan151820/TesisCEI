const pool = require('../config/db')

async function listarCatalogo() {
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
     WHERE p.estado_visibilidad = 'publicado'
       AND p.habilitado = true
     GROUP BY p.id, p.nombre, p.descripcion, p.imagen_url, c.nombre, d.nombre_comercial, d.id
     ORDER BY p.fecha_creacion DESC`
  )
  return resultado.rows
}

module.exports = { listarCatalogo }
