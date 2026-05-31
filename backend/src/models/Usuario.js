const pool = require("../config/database");

class Usuario {
  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static async findAllActive() {
    const [usuarios] = await pool.execute(
      `SELECT u.username, u.email, u.nombre_completo, u.rol_id, r.nombre AS rol_nombre, u.activo
       FROM Usuario u
       JOIN Rol r ON u.rol_id = r.rol_id
       WHERE u.activo = 1
       ORDER BY u.nombre_completo ASC, u.username ASC`,
    );

    return usuarios;
  }

  static async findByUsername(username) {
    const [usuarios] = await pool.execute(
      `SELECT username, email, nombre_completo, rol_id, activo
       FROM Usuario
       WHERE username = ?`,
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
    };
  }

  static async update(username, { nombre_completo = null, email, rol_id }) {
    const incluyeEmail = email !== undefined;
    let emailActual = email;

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
         WHERE username = ? AND activo = 1`,
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
       WHERE username = ? AND activo = 1`,
      [nombre_completo, emailActual, rol_id, username],
    );

    return result.affectedRows > 0;
  }

  static async softDelete(username) {
    const [result] = await pool.execute(
      `UPDATE Usuario
       SET activo = 0
       WHERE username = ? AND activo = 1`,
      [username],
    );

    return result.affectedRows > 0;
  }

  static async updatePassword(username, password_hash) {
    const [result] = await pool.execute(
      `UPDATE Usuario
       SET password_hash = ?
       WHERE username = ? AND activo = 1`,
      [password_hash, username],
    );

    return result.affectedRows > 0;
  }
}

module.exports = Usuario;
