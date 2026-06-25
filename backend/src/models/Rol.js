const pool = require("../config/database");

const normalizarPermisoRol = (permiso) => ({
  permiso_id: permiso.permiso_id,
  puede_ver: permiso.puede_ver ? 1 : 0,
  puede_crear: permiso.puede_crear ? 1 : 0,
  puede_editar: permiso.puede_editar ? 1 : 0,
  puede_eliminar: permiso.puede_eliminar ? 1 : 0,
});

const ROLES_PROTEGIDOS = ["admin", "super_admin"];
const normalizarRol = (rol) => String(rol || "").trim().toLowerCase();
const rolEsProtegido = (nombre) => ROLES_PROTEGIDOS.includes(normalizarRol(nombre));

class Rol {
  static async findById(rol_id) {
    const [roles] = await pool.execute(
      `SELECT rol_id, nombre, descripcion, activo
       FROM Rol
       WHERE rol_id = ? AND activo = 1`,
      [rol_id],
    );

    return roles[0] || null;
  }

  static async findAllActive({ incluirSuperAdmin = false, incluirInactivos = false } = {}) {
    const params = [];
    let where = "WHERE 1 = 1";

    if (!incluirInactivos) {
      where += " AND activo = 1";
    }

    if (!incluirSuperAdmin) {
      where += " AND LOWER(nombre) <> ?";
      params.push("super_admin");
    }

    const [roles] = await pool.execute(
      `SELECT rol_id, nombre, descripcion, activo
       FROM Rol
       ${where}
       ORDER BY nombre ASC`,
      params,
    );

    if (roles.length === 0) return roles;

    const [permisos] = await pool.execute(
      `SELECT rp.rol_id, p.permiso_id, p.nombre, p.modulo,
              rp.puede_ver, rp.puede_crear, rp.puede_editar, rp.puede_eliminar
       FROM Rol_permiso rp
       JOIN Permiso p ON rp.permiso_id = p.permiso_id
       WHERE rp.rol_id IN (${roles.map(() => "?").join(",")})
       ORDER BY p.modulo ASC, p.nombre ASC`,
      roles.map((rol) => rol.rol_id),
    );

    return roles.map((rol) => ({
      ...rol,
      permisos: permisos.filter((permiso) => permiso.rol_id === rol.rol_id),
    }));
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
    const [rolActualRows] = await pool.execute(
      `SELECT nombre FROM Rol WHERE rol_id = ? AND activo = 1`,
      [rol_id],
    );

    if (rolActualRows.length === 0) {
      return false;
    }

    if (rolEsProtegido(rolActualRows[0].nombre)) {
      throw new Error("NO_SE_PUEDE_MODIFICAR_ROL_PROTEGIDO");
    }

    const [result] = await pool.execute(
      `UPDATE Rol
       SET nombre = ?, descripcion = ?
       WHERE rol_id = ? AND activo = 1`,
      [nombre, descripcion, rol_id],
    );

    return result.affectedRows > 0;
  }

  static async updateWithPermissions(rol_id, { nombre, descripcion = null, permisos = [] }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [rolActualRows] = await connection.execute(
        `SELECT nombre FROM Rol WHERE rol_id = ? AND activo = 1`,
        [rol_id],
      );

      if (rolActualRows.length === 0) {
        await connection.rollback();
        return false;
      }

      if (rolEsProtegido(rolActualRows[0].nombre)) {
        throw new Error("NO_SE_PUEDE_MODIFICAR_ROL_PROTEGIDO");
      }

      await connection.execute(
        `UPDATE Rol
         SET nombre = ?, descripcion = ?
         WHERE rol_id = ? AND activo = 1`,
        [nombre, descripcion, rol_id],
      );

      await connection.execute(`DELETE FROM Rol_permiso WHERE rol_id = ?`, [rol_id]);

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
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async softDelete(rol_id) {
    const [roles] = await pool.execute(
      `SELECT nombre FROM Rol WHERE rol_id = ?`,
      [rol_id],
    );

    if (rolEsProtegido(roles[0]?.nombre)) {
      throw new Error("NO_SE_PUEDE_ELIMINAR_ROL_PROTEGIDO");
    }

    const [usuariosAsignados] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM Usuario
       WHERE rol_id = ? AND (eliminado = 0 OR activo = 1)`,
      [rol_id],
    );

    if (Number(usuariosAsignados[0]?.total || 0) > 0) {
      throw new Error("ROL_ASIGNADO_A_USUARIO");
    }

    const [result] = await pool.execute(
      `UPDATE Rol
       SET activo = 0
       WHERE rol_id = ? AND activo = 1`,
      [rol_id],
    );

    return result.affectedRows > 0;
  }

  static async updateEstado(rol_id, activo) {
    const [roles] = await pool.execute(
      `SELECT nombre FROM Rol WHERE rol_id = ?`,
      [rol_id],
    );

    if (rolEsProtegido(roles[0]?.nombre)) {
      throw new Error("NO_SE_PUEDE_MODIFICAR_ROL_PROTEGIDO");
    }

    const [result] = await pool.execute(
      `UPDATE Rol
       SET activo = ?
       WHERE rol_id = ?`,
      [activo ? 1 : 0, rol_id],
    );

    return result.affectedRows > 0;
  }
}

module.exports = Rol;
