import pool from '../config/db.js'

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

export default Categoria
