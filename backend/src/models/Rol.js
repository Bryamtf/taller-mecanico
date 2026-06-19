const pool = require("../config/database");

const normalizarPermisoRol = (permiso) => ({
  permiso_id: permiso.permiso_id,
  puede_ver: permiso.puede_ver ? 1 : 0,
  puede_crear: permiso.puede_crear ? 1 : 0,
  puede_editar: permiso.puede_editar ? 1 : 0,
  puede_eliminar: permiso.puede_eliminar ? 1 : 0,
});

class Rol {
  static async findAllActive() {
    const [roles] = await pool.execute(
      `SELECT rol_id, nombre, descripcion, activo
       FROM Rol
       WHERE activo = 1
       ORDER BY nombre ASC`,
    );

    return roles;
  }

  static async createWithPermissions({ nombre, descripcion = null, permisos = [] }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [rolResult] = await connection.execute(
        `INSERT INTO Rol (nombre, descripcion)
         VALUES (?, ?)`,
        [nombre, descripcion],
      );

      const rol_id = rolResult.insertId;

      for (const permiso of permisos) {
        if (!permiso.permiso_id) {
          throw new Error("Cada permiso debe incluir permiso_id");
        }

        const permisoRol = normalizarPermisoRol(permiso);

        await connection.execute(
          `INSERT INTO Rol_permiso
            (rol_id, permiso_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            rol_id,
            permisoRol.permiso_id,
            permisoRol.puede_ver,
            permisoRol.puede_crear,
            permisoRol.puede_editar,
            permisoRol.puede_eliminar,
          ],
        );
      }

      await connection.commit();

      return { rol_id, nombre, descripcion };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(rol_id, { nombre, descripcion = null }) {
    const [result] = await pool.execute(
      `UPDATE Rol
       SET nombre = ?, descripcion = ?
       WHERE rol_id = ? AND activo = 1`,
      [nombre, descripcion, rol_id],
    );

    return result.affectedRows > 0;
  }

  static async softDelete(rol_id) {
    const [result] = await pool.execute(
      `UPDATE Rol
       SET activo = 0
       WHERE rol_id = ? AND activo = 1`,
      [rol_id],
    );

    return result.affectedRows > 0;
  }
}

module.exports = Rol;
