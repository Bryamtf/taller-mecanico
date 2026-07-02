const pool = require("../config/database");

class Usuario {
  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static async findAllActive() {
    const [usuarios] = await pool.execute(
      `SELECT u.username, u.email, u.nombre_completo, u.rol_id, r.nombre AS rol_nombre, u.activo, u.eliminado
       FROM Usuario u
       JOIN Rol r ON u.rol_id = r.rol_id
       WHERE u.eliminado = 0
       ORDER BY u.nombre_completo ASC, u.username ASC`,
    );

    return usuarios;
  }

  static async findAll({
    estado = "activos",
    busqueda = "",
    incluirRolesProtegidos = false,
    usernameActual = null,
  } = {}) {
    const params = [];
    const condicionesEstado = [];
    const condicionesBusqueda = [];

    if (estado === "desactivados") {
      condicionesEstado.push("u.eliminado = 1");
    } else if (estado !== "todos") {
      condicionesEstado.push("u.eliminado = 0");
    }

    if (busqueda) {
      condicionesBusqueda.push(`(
        u.username LIKE ? OR
        u.email LIKE ? OR
        u.nombre_completo LIKE ? OR
        r.nombre LIKE ?
      )`);
      const like = `%${busqueda}%`;
      params.push(like, like, like, like);
    }

    let where = condicionesEstado.length
      ? `WHERE ${condicionesEstado.join(" AND ")}`
      : "WHERE 1 = 1";

    if (!incluirRolesProtegidos) {
      if (usernameActual) {
        const filtroBusqueda = condicionesBusqueda.length ? `${condicionesBusqueda.join(" AND ")} AND ` : "";
        where += ` AND ((${filtroBusqueda}LOWER(r.nombre) NOT IN ('admin', 'super_admin')) OR u.username = ?)`;
        params.push(usernameActual);
      } else {
        if (condicionesBusqueda.length) {
          where += ` AND ${condicionesBusqueda.join(" AND ")}`;
        }
        where += " AND LOWER(r.nombre) NOT IN ('admin', 'super_admin')";
      }
    } else if (condicionesBusqueda.length) {
      where += ` AND ${condicionesBusqueda.join(" AND ")}`;
    }

    const [usuarios] = await pool.execute(
      `SELECT u.username, u.email, u.nombre_completo, u.rol_id, r.nombre AS rol_nombre,
              r.activo AS rol_activo, u.activo, u.eliminado, u.ultimo_acceso, u.create_time
       FROM Usuario u
       JOIN Rol r ON u.rol_id = r.rol_id
       ${where}
       ORDER BY u.eliminado ASC, u.nombre_completo ASC, u.username ASC`,
      params,
    );

    return usuarios;
  }

  static async findByUsername(username) {
    const [usuarios] = await pool.execute(
      `SELECT u.username, u.email, u.nombre_completo, u.rol_id, r.nombre AS rol_nombre,
              r.activo AS rol_activo, u.activo, u.eliminado, u.password_hash
       FROM Usuario u
       JOIN Rol r ON u.rol_id = r.rol_id
       WHERE u.username = ?`,
      [username],
    );

    return usuarios[0] || null;
  }

  static async create({
    username,
    email = null,
    password_hash,
    nombre_completo = null,
    rol_id,
  }) {
    if (!email) {
      throw new Error("EL_CORREO_ES_REQUERIDO");
    }

    if (!Usuario.isValidEmail(email)) {
      throw new Error("FORMATO_DE_CORREO_INVALIDO");
    }

    const [usuariosExistentes] = await pool.execute(
      `SELECT username, email
       FROM Usuario
       WHERE email = ? OR username = ?`,
      [email, username],
    );

    if (
      usuariosExistentes.some(
        (usuario) => usuario.email.toLowerCase() === email.toLowerCase(),
      )
    ) {
      throw new Error("EL_CORREO_YA_ESTA_REGISTRADO");
    }

    if (
      usuariosExistentes.some(
        (usuario) => usuario.username.toLowerCase() === username.toLowerCase(),
      )
    ) {
      throw new Error("EL_USERNAME_YA_ESTA_EN_USO");
    }

    await pool.execute(
      `INSERT INTO Usuario
        (username, email, password_hash, nombre_completo, rol_id)
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, password_hash, nombre_completo, rol_id],
    );

    return {
      username,
      email,
      nombre_completo,
      rol_id,
      activo: 1,
      eliminado: 0,
    };
  }

  static async update(username, { nombre_completo = null, email, rol_id }, { incluirEliminados = false } = {}) {
    const incluyeEmail = email !== undefined;
    let emailActual = email;
    const filtroEliminado = incluirEliminados ? "" : " AND eliminado = 0";

    if (incluyeEmail) {
      if (!Usuario.isValidEmail(email)) {
        throw new Error("FORMATO_DE_CORREO_INVALIDO");
      }

      const [usuariosExistentes] = await pool.execute(
        `SELECT username
         FROM Usuario
         WHERE email = ? AND username <> ?`,
        [email, username],
      );

      if (usuariosExistentes.length > 0) {
        throw new Error("EL_CORREO_YA_ESTA_REGISTRADO");
      }
    } else {
      const [usuarios] = await pool.execute(
        `SELECT email
         FROM Usuario
         WHERE username = ?${filtroEliminado}`,
        [username],
      );

      if (usuarios.length === 0) {
        return false;
      }

      emailActual = usuarios[0].email;
    }

    const [result] = await pool.execute(
      `UPDATE Usuario
       SET nombre_completo = ?, email = ?, rol_id = ?
       WHERE username = ?${filtroEliminado}`,
      [nombre_completo, emailActual, rol_id, username],
    );

    return result.affectedRows > 0;
  }

  static async softDelete(username) {
    const [result] = await pool.execute(
      `UPDATE Usuario
       SET activo = 0, eliminado = 1
       WHERE username = ? AND eliminado = 0`,
      [username],
    );

    return result.affectedRows > 0;
  }

  static async updateEstado(username, { activo, eliminado }) {
    const [result] = await pool.execute(
      `UPDATE Usuario
       SET activo = ?, eliminado = ?
       WHERE username = ?`,
      [activo ? 1 : 0, eliminado ? 1 : 0, username],
    );

    return result.affectedRows > 0;
  }

  static async updatePassword(username, password_hash) {
    const [result] = await pool.execute(
      `UPDATE Usuario
       SET password_hash = ?
       WHERE username = ? AND eliminado = 0`,
      [password_hash, username],
    );

    return result.affectedRows > 0;
  }
}

module.exports = Usuario;
