const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");

const PASSWORD_DEFAULT = "Autonort2026";
const ERRORES_USUARIO = {
  EL_CORREO_ES_REQUERIDO: { status: 400, message: "El correo es requerido" },
  FORMATO_DE_CORREO_INVALIDO: { status: 400, message: "Formato de correo invalido" },
  EL_CORREO_YA_ESTA_REGISTRADO: { status: 409, message: "El correo ya esta registrado" },
  EL_USERNAME_YA_ESTA_EN_USO: { status: 409, message: "El username ya existe" },
};

const usuarioController = {
  async listarUsuarios(req, res) {
    try {
      const usuarios = await Usuario.findAllActive();

      res.json({
        success: true,
        message: "Usuarios listados exitosamente",
        data: { usuarios },
      });
    } catch (error) {
      console.error("Error al listar usuarios:", error);
      res.status(500).json({
        success: false,
        message: "Error al listar usuarios",
        data: null,
      });
    }
  },

  async crearUsuario(req, res) {
    try {
      const { username, email = null, password, nombre_completo = null, rol_id } = req.body;

      if (!username || !password || !rol_id) {
        return res.status(400).json({
          success: false,
          message: "username, password y rol_id son requeridos",
          data: null,
        });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const usuario = await Usuario.create({
        username,
        email,
        password_hash,
        nombre_completo,
        rol_id,
      });

      res.status(201).json({
        success: true,
        message: "Usuario creado exitosamente",
        data: {
          usuario,
        },
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);

      const errorUsuario = ERRORES_USUARIO[error.message];
      const status = errorUsuario
        ? errorUsuario.status
        : error.code === "ER_NO_REFERENCED_ROW_2"
          ? 400
          : 500;
      const message = errorUsuario
        ? errorUsuario.message
        : error.code === "ER_NO_REFERENCED_ROW_2"
          ? "El rol_id enviado no existe"
          : "Error al crear usuario";

      res.status(status).json({
        success: false,
        message,
        data: null,
      });
    }
  },

  async actualizarUsuario(req, res) {
    try {
      const { username } = req.params;
      const { nombre_completo = null, rol_id } = req.body;
      const datosActualizar = {
        nombre_completo,
        rol_id,
      };

      if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
        datosActualizar.email = req.body.email;
      }

      if (!rol_id) {
        return res.status(400).json({
          success: false,
          message: "rol_id es requerido",
          data: null,
        });
      }

      const actualizado = await Usuario.update(username, datosActualizar);

      if (!actualizado) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          data: null,
        });
      }

      res.json({
        success: true,
        message: "Usuario actualizado exitosamente",
        data: {
          usuario: {
            username,
            email: Object.prototype.hasOwnProperty.call(req.body, "email")
              ? req.body.email
              : null,
            nombre_completo,
            rol_id,
          },
        },
      });
    } catch (error) {
      console.error("Error al actualizar usuario:", error);

      const errorUsuario = ERRORES_USUARIO[error.message];
      const status = errorUsuario
        ? errorUsuario.status
        : error.code === "ER_NO_REFERENCED_ROW_2"
          ? 400
          : 500;
      const message = errorUsuario
        ? errorUsuario.message
        : error.code === "ER_NO_REFERENCED_ROW_2"
          ? "El rol_id enviado no existe"
          : "Error al actualizar usuario";

      res.status(status).json({
        success: false,
        message,
        data: null,
      });
    }
  },

  async eliminarUsuario(req, res) {
    try {
      const { username } = req.params;

      const eliminado = await Usuario.softDelete(username);

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          data: null,
        });
      }

      res.json({
        success: true,
        message: "Usuario eliminado exitosamente",
        data: { username },
      });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar usuario",
        data: null,
      });
    }
  },

  async resetPassword(req, res) {
    try {
      const { username } = req.params;
      const password_hash = await bcrypt.hash(PASSWORD_DEFAULT, 10);

      const actualizado = await Usuario.updatePassword(username, password_hash);

      if (!actualizado) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          data: null,
        });
      }

      res.json({
        success: true,
        message: "Password reseteado exitosamente",
        data: { username, password_default: PASSWORD_DEFAULT },
      });
    } catch (error) {
      console.error("Error al resetear password:", error);
      res.status(500).json({
        success: false,
        message: "Error al resetear password",
        data: null,
      });
    }
  },
};

module.exports = usuarioController;
