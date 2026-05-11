const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const authController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Usuario y contraseña son requeridos",
        });
      }

      const [rows] = await pool.execute(
        `SELECT u.username, u.password_hash, u.nombre_completo, u.activo, 
                        u.rol_id, r.nombre as rol_nombre
                 FROM Usuario u
                 JOIN Rol r ON u.rol_id = r.rol_id
                 WHERE u.username = ?`,
        [username],
      );

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Usuario o contraseña incorrectos",
        });
      }

      const user = rows[0];

      if (!user.activo) {
        return res.status(401).json({
          success: false,
          message: "Usuario inactivo. Contacte al administrador.",
        });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Usuario o contraseña incorrectos",
        });
      }

      await pool.execute(
        `UPDATE Usuario SET ultimo_acceso = NOW() WHERE username = ?`,
        [username],
      );

      const token = jwt.sign(
        {
          username: user.username,
          rol: user.rol_nombre,
          rol_id: user.rol_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      res.json({
        success: true,
        message: "Login exitoso",
        data: {
          token,
          usuario: {
            username: user.username,
            nombre_completo: user.nombre_completo,
            rol: user.rol_nombre,
          },
        },
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({
        success: false,
        message: "Error al iniciar sesión",
      });
    }
  },

  async verificarToken(req, res) {
    try {
      res.json({
        success: true,
        data: {
          usuario: req.user,
        },
      });
    } catch (error) {
      console.error("Error al verificar token:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar token",
      });
    }
    },
  
  async cambiarPassword(req, res) {
    try {
      const { username } = req.user;
      const { password_actual, password_nueva } = req.body;

      if (!password_actual || !password_nueva) {
        return res.status(400).json({
          success: false,
          message: "Contraseña actual y nueva son requeridas",
        });
      }

      const [rows] = await pool.execute(
        `SELECT password_hash FROM Usuario WHERE username = ?`,
        [username],
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      const isValid = await bcrypt.compare(
        password_actual,
        rows[0].password_hash,
      );

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Contraseña actual incorrecta",
        });
      }

      const newHash = await bcrypt.hash(password_nueva, 10);

      await pool.execute(
        `UPDATE Usuario SET password_hash = ? WHERE username = ?`,
        [newHash, username],
      );

      res.json({
        success: true,
        message: "Contraseña actualizada exitosamente",
      });
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      res.status(500).json({
        success: false,
        message: "Error al cambiar contraseña",
      });
    }
  },
};
module.exports = authController;
