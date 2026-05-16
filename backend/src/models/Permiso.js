const pool = require("../config/database");

class Permiso {
  static async findAll() {
    const [permisos] = await pool.execute(
      `SELECT permiso_id, nombre, modulo
       FROM Permiso
       ORDER BY modulo ASC, nombre ASC`,
    );

    return permisos;
  }
}

module.exports = Permiso;
