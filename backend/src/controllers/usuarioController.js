const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");
const Rol = require("../models/Rol");

const ERRORES_USUARIO = {
  EL_CORREO_ES_REQUERIDO: { status: 400, message: "El correo es requerido" },
  FORMATO_DE_CORREO_INVALIDO: { status: 400, message: "Formato de correo invalido" },
  EL_CORREO_YA_ESTA_REGISTRADO: { status: 409, message: "El correo ya esta registrado" },
  EL_USERNAME_YA_ESTA_EN_USO: { status: 409, message: "El username ya existe" },
};

const ROLES_ADMINISTRADORES = ["admin", "super_admin"];
const ROLES_PROTEGIDOS = ["admin", "super_admin"];
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const normalizarRol = (rol) => String(rol || "").trim().toLowerCase();
const esSuperAdmin = (user) => normalizarRol(user?.rol_nombre) === "super_admin";
const esAdminOSuperAdmin = (user) => ROLES_ADMINISTRADORES.includes(normalizarRol(user?.rol_nombre));
const objetivoEsProtegidoParaRegular = (usuarioObjetivo, req) =>
  ROLES_PROTEGIDOS.includes(normalizarRol(usuarioObjetivo?.rol_nombre)) && !esAdminOSuperAdmin(req.user);
const adminIntentaTocarProtegidoAjeno = (usuarioObjetivo, req) =>
  normalizarRol(req.user?.rol_nombre) === "admin" &&
  ROLES_PROTEGIDOS.includes(normalizarRol(usuarioObjetivo?.rol_nombre)) &&
  usuarioObjetivo?.username !== req.user.username;

const usuarioController = {
  async listarUsuarios(req, res) {
    try {
      const estado = req.query.estado || (esSuperAdmin(req.user) ? "todos" : "activos");
      const { busqueda = "" } = req.query;

      if (["desactivados", "todos"].includes(estado) && !esSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Solo el super administrador puede ver usuarios desactivados",
          data: null,
        });
      }

      const usuarios = await Usuario.findAll({
        estado,
        busqueda,
        incluirRolesProtegidos: esSuperAdmin(req.user),
        usernameActual: normalizarRol(req.user.rol_nombre) === "admin" ? req.user.username : null,
      });

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

      if (!esAdminOSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Solo admin o super_admin pueden crear usuarios",
          data: null,
        });
      }

      if (!username || !password || !rol_id) {
        return res.status(400).json({
          success: false,
          message: "username, password y rol_id son requeridos",
          data: null,
        });
      }

      const rolDestino = await Rol.findById(rol_id);

      if (!rolDestino) {
        return res.status(400).json({
          success: false,
          message: "El rol_id enviado no existe",
          data: null,
        });
      }

      if (ROLES_PROTEGIDOS.includes(rolDestino.nombre) && !esAdminOSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "No puedes asignar roles protegidos por el sistema",
          data: null,
        });
      }

      if (normalizarRol(rolDestino.nombre) === "super_admin" && !esSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Solo el super administrador puede crear otro super administrador",
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
      const usuarioActual = await Usuario.findByUsername(username);

      if (!usuarioActual || (usuarioActual.eliminado && !esSuperAdmin(req.user))) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          data: null,
        });
      }

      if (objetivoEsProtegidoParaRegular(usuarioActual, req)) {
        return res.status(403).json({
          success: false,
          message: "No puedes modificar usuarios protegidos por el sistema",
          data: null,
        });
      }

      if (adminIntentaTocarProtegidoAjeno(usuarioActual, req)) {
        return res.status(403).json({
          success: false,
          message: "Un administrador no puede modificar a otros administradores ni al super administrador",
          data: null,
        });
      }

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

      const rolDestino = await Rol.findById(rol_id);

      if (!rolDestino) {
        return res.status(400).json({
          success: false,
          message: "El rol_id enviado no existe",
          data: null,
        });
      }

      if (ROLES_PROTEGIDOS.includes(rolDestino.nombre) && !esAdminOSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "No puedes asignar roles protegidos por el sistema",
          data: null,
        });
      }

      if (normalizarRol(rolDestino.nombre) === "super_admin" && !esSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Solo el super administrador puede asignar el rol super_admin",
          data: null,
        });
      }

      const actualizado = await Usuario.update(username, datosActualizar, {
        incluirEliminados: esSuperAdmin(req.user),
      });

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
      const usuarioObjetivo = await Usuario.findByUsername(username);

      if (!usuarioObjetivo || usuarioObjetivo.eliminado) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          data: null,
        });
      }

      if (username === req.user.username) {
        return res.status(403).json({
          success: false,
          message: "No puedes eliminar tu propio usuario",
          data: null,
        });
      }

      if (objetivoEsProtegidoParaRegular(usuarioObjetivo, req)) {
        return res.status(403).json({
          success: false,
          message: "No puedes modificar usuarios protegidos por el sistema",
          data: null,
        });
      }

      if (normalizarRol(usuarioObjetivo.rol_nombre) === "super_admin") {
        return res.status(403).json({
          success: false,
          message: "No se puede eliminar al super administrador",
          data: null,
        });
      }

      if (normalizarRol(usuarioObjetivo.rol_nombre) === "admin" && !esSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Un administrador no puede eliminar a otro administrador",
          data: null,
        });
      }

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

  async cambiarEstado(req, res) {
    try {
      const { username } = req.params;
      const { activo } = req.body;

      if (!esSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Solo el super administrador puede reactivar usuarios",
          data: null,
        });
      }

      const usuarioObjetivo = await Usuario.findByUsername(username);

      if (!usuarioObjetivo) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          data: null,
        });
      }

      if (objetivoEsProtegidoParaRegular(usuarioObjetivo, req)) {
        return res.status(403).json({
          success: false,
          message: "No puedes modificar usuarios protegidos por el sistema",
          data: null,
        });
      }

      const nuevoActivo = activo === true || activo === 1 || activo === "1";

      if (username === req.user.username && !nuevoActivo) {
        return res.status(403).json({
          success: false,
          message: "No puedes desactivar tu propio usuario",
          data: null,
        });
      }

      if (nuevoActivo && usuarioObjetivo.rol_activo === 0) {
        return res.status(400).json({
          success: false,
          code: "ROLE_DISABLED",
          message: "El rol asignado a este usuario está desactivado",
          data: null,
        });
      }

      const actualizado = await Usuario.updateEstado(username, {
        activo: nuevoActivo,
        eliminado: !nuevoActivo,
      });

      if (!actualizado) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          data: null,
        });
      }

      res.json({
        success: true,
        message: nuevoActivo ? "Usuario reactivado exitosamente" : "Usuario desactivado exitosamente",
        data: { username, activo: nuevoActivo ? 1 : 0, eliminado: nuevoActivo ? 0 : 1 },
      });
    } catch (error) {
      console.error("Error al cambiar estado de usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error al cambiar estado de usuario",
        data: null,
      });
    }
  },

  async resetPassword(req, res) {
    try {
      const { username } = req.params;
      const { password_nueva } = req.body;

      if (!password_nueva || !PASSWORD_REGEX.test(password_nueva)) {
        return res.status(400).json({
          success: false,
          message: "La nueva password debe tener 8 caracteres, mayuscula, minuscula y numero",
          data: null,
        });
      }

      const usuarioObjetivo = await Usuario.findByUsername(username);

      if (!usuarioObjetivo || usuarioObjetivo.eliminado) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          data: null,
        });
      }

      if (objetivoEsProtegidoParaRegular(usuarioObjetivo, req)) {
        return res.status(403).json({
          success: false,
          message: "No puedes modificar usuarios protegidos por el sistema",
          data: null,
        });
      }

      if (normalizarRol(usuarioObjetivo.rol_nombre) === "super_admin") {
        return res.status(403).json({
          success: false,
          message: "No se puede cambiar la password del super administrador desde este flujo",
          data: null,
        });
      }

      if (normalizarRol(usuarioObjetivo.rol_nombre) === "admin" && !esSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Un administrador no puede cambiar la password de otro administrador",
          data: null,
        });
      }

      const password_hash = await bcrypt.hash(password_nueva, 10);

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
        data: { username },
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
