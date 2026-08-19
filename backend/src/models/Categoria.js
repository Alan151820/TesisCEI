const pool = require('../config/db')

class Categoria {
  constructor(data) {
    this.id = data.id
    this.nombre = data.nombre
  }

  static async listarTodas() {
    const resultado = await pool.query('SELECT id, nombre FROM categoria ORDER BY nombre')
    return resultado.rows.map(r => new Categoria(r))
  }
}

module.exports = Categoria
