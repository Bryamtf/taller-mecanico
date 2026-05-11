const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No autorizado. Token no proporcionado",
      });
    }
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.execute(
      `SELECT u.username, u.email, u.nombre_completo, u.activo, u.rol_id, r.nombre as rol_nombre
             FROM Usuario u
             JOIN Rol r ON u.rol_id = r.rol_id
             WHERE u.username = ? AND u.activo = 1`,
      [decoded.username],
    );
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado o inactivo",
      });
    }
    req.user = {
      username: rows[0].username,
      email: rows[0].email,
      nombre_completo: rows[0].nombre_completo,
      rol_id: rows[0].rol_id,
      rol_nombre: rows[0].rol_nombre,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
      });
    }

    console.error("Error en authMiddleware:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al validar autenticación",
    });
  }
};
const checkPermiso = (permisoNombre) => {
  return async (req, res, next) => {
    try {
      const { rol_id, username } = req.user;
      const [rows] = await pool.execute(
        `SELECT rp.* 
                 FROM Rol_permiso rp
                 JOIN Permiso p ON rp.permiso_id = p.permiso_id
                 WHERE rp.rol_id = ? AND p.nombre = ?`,
        [rol_id, permisoNombre],
      );
      if (rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: `No tienes permiso para ${permisoNombre.replace("_", " ")}`,
        });
      }
      const permiso = rows[0];
      const metodo = req.method;
      let tienePermiso = false;
      if (metodo === "GET") {
        tienePermiso = permiso.puede_ver === 1;
      } else if (metodo === "POST") {
        tienePermiso = permiso.puede_crear === 1;
      } else if (metodo === "PUT" || metodo === "PATCH") {
        tienePermiso = permiso.puede_editar === 1;
      } else if (metodo === "DELETE") {
        tienePermiso = permiso.puede_eliminar === 1;
      }

      if (!tienePermiso) {
        return res.status(403).json({
          success: false,
          message: `No tienes permiso para ${metodo} en ${permisoNombre}`,
        });
      }
      next();
    } catch (error) {
      console.error("Error en checkPermiso:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar permisos",
      });
    }
  };
};

const checkRol = (rolesPermitidos) => {
  return (req, res, next) => {
    const { rol_nombre } = req.user;

    if (!rolesPermitidos.includes(rol_nombre)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de estos roles: ${rolesPermitidos.join(", ")}`,
      });
    }
    next();
  };
};
const checkCreador = (tabla, idField, userField = "creado_por") => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const { username } = req.user;
      const { rol_nombre } = req.user;

      // Admin y gerente pueden todo
      if (rol_nombre === "gerente" || rol_nombre === "socio") {
        return next();
      }

      const [rows] = await pool.execute(
        `SELECT ${userField} FROM ${tabla} WHERE ${idField} = ?`,
        [resourceId],
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Recurso no encontrado",
        });
      }

      if (rows[0][userField] !== username) {
        return res.status(403).json({
          success: false,
          message: "No tienes permiso para modificar este recurso",
        });
      }

      next();
    } catch (error) {
      console.error("Error en checkCreador:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar creador del recurso",
      });
    }
  };
};
module.exports = {
  authMiddleware,
  checkPermiso,
  checkRol,
  checkCreador,
};