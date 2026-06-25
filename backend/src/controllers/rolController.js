const Rol = require("../models/Rol");

const ROLES_ADMINISTRADORES = ["admin", "super_admin"];
const ROLES_PROTEGIDOS = ["admin", "super_admin"];
const normalizarRol = (rol) => String(rol || "").trim().toLowerCase();
const esSuperAdmin = (user) => normalizarRol(user?.rol_nombre) === "super_admin";
const esAdminOSuperAdmin = (user) => ROLES_ADMINISTRADORES.includes(normalizarRol(user?.rol_nombre));
const rolEsProtegido = (rol) => ROLES_PROTEGIDOS.includes(normalizarRol(rol?.nombre));
const nombreRolEsProtegido = (nombre) =>
  ROLES_PROTEGIDOS.includes(normalizarRol(nombre));

const rolController = {
  async listarRoles(req, res) {
    try {
      const incluirInactivos = esSuperAdmin(req.user) && req.query.estado !== "activos";
      const roles = await Rol.findAllActive({
        incluirSuperAdmin: esSuperAdmin(req.user),
        incluirInactivos,
      });

      res.json({
        success: true,
        message: "Roles listados exitosamente",
        data: { roles },
      });
    } catch (error) {
      console.error("Error al listar roles:", error);
      res.status(500).json({
        success: false,
        message: "Error al listar roles",
        data: null,
      });
    }
  },

  async crearRol(req, res) {
    try {
      const { nombre, descripcion = null, permisos = [] } = req.body;

      if (!esAdminOSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Solo admin o super_admin pueden crear roles",
          data: null,
        });
      }

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: "El nombre del rol es requerido",
          data: null,
        });
      }

      if (nombreRolEsProtegido(nombre)) {
        return res.status(403).json({
          success: false,
          message: "No se puede crear un rol protegido por el sistema",
          data: null,
        });
      }

      if (!Array.isArray(permisos)) {
        return res.status(400).json({
          success: false,
          message: "Los permisos deben enviarse como un arreglo",
          data: null,
        });
      }

      const rol = await Rol.createWithPermissions({
        nombre,
        descripcion,
        permisos,
      });

      res.status(201).json({
        success: true,
        message: "Rol creado exitosamente",
        data: rol,
      });
    } catch (error) {
      console.error("Error al crear rol:", error);

      const status = error.code === "ER_DUP_ENTRY" ? 409 : 500;
      const message =
        error.code === "ER_DUP_ENTRY"
          ? "Ya existe un rol con ese nombre"
          : "Error al crear rol";

      res.status(status).json({
        success: false,
        message,
        data: null,
      });
    }
  },

  async actualizarRol(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion = null, permisos } = req.body;

      const rolActual = await Rol.findById(id);

      if (!rolActual) {
        return res.status(404).json({
          success: false,
          message: "Rol no encontrado",
          data: null,
        });
      }

      if (rolEsProtegido(rolActual)) {
        return res.status(403).json({
          success: false,
          message: `No se puede modificar el rol ${rolActual.nombre}`,
          data: null,
        });
      }

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: "El nombre del rol es requerido",
          data: null,
        });
      }

      if (nombreRolEsProtegido(nombre)) {
        return res.status(403).json({
          success: false,
          message: "No se puede renombrar un rol como protegido por el sistema",
          data: null,
        });
      }

      const actualizado = Array.isArray(permisos)
        ? await Rol.updateWithPermissions(id, { nombre, descripcion, permisos })
        : await Rol.update(id, { nombre, descripcion });

      if (!actualizado) {
        return res.status(404).json({
          success: false,
          message: "Rol no encontrado",
          data: null,
        });
      }

      res.json({
        success: true,
        message: "Rol actualizado exitosamente",
        data: { rol_id: Number(id), nombre, descripcion },
      });
    } catch (error) {
      console.error("Error al actualizar rol:", error);

      const status = error.code === "ER_DUP_ENTRY"
        ? 409
        : error.message === "NO_SE_PUEDE_MODIFICAR_ROL_PROTEGIDO"
          ? 403
          : 500;
      const message =
        error.code === "ER_DUP_ENTRY"
          ? "Ya existe un rol con ese nombre"
          : error.message === "NO_SE_PUEDE_MODIFICAR_ROL_PROTEGIDO"
          ? "No se puede modificar un rol protegido por el sistema"
          : "Error al actualizar rol";

      res.status(status).json({
        success: false,
        message,
        data: null,
      });
    }
  },

  async eliminarRol(req, res) {
    try {
      const { id } = req.params;

      if (!esAdminOSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Solo admin o super_admin pueden eliminar roles",
          data: null,
        });
      }

      const eliminado = await Rol.softDelete(id);

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: "Rol no encontrado",
          data: null,
        });
      }

      res.json({
        success: true,
        message: "Rol eliminado exitosamente",
        data: { rol_id: Number(id) },
      });
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      if (error.message === "NO_SE_PUEDE_ELIMINAR_ROL_PROTEGIDO") {
        return res.status(403).json({
          success: false,
          message: "No se puede eliminar un rol protegido por el sistema",
          data: null,
        });
      }
      if (error.message === "ROL_ASIGNADO_A_USUARIO") {
        return res.status(400).json({
          success: false,
          message: "El rol está asignado a un usuario y no se dejará eliminar hasta que no haya ningún usuario con ese rol.",
          data: null,
        });
      }
      res.status(500).json({
        success: false,
        message: "Error al eliminar rol",
        data: null,
      });
    }
  },

  async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      const nuevoActivo = activo === true || activo === 1 || activo === "1";

      if (!esSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Solo el super administrador puede reactivar roles",
          data: null,
        });
      }

      const actualizado = await Rol.updateEstado(id, nuevoActivo);

      if (!actualizado) {
        return res.status(404).json({
          success: false,
          message: "Rol no encontrado",
          data: null,
        });
      }

      res.json({
        success: true,
        message: nuevoActivo ? "Rol reactivado exitosamente" : "Rol desactivado exitosamente",
        data: { rol_id: Number(id), activo: nuevoActivo ? 1 : 0 },
      });
    } catch (error) {
      console.error("Error al cambiar estado de rol:", error);
      if (error.message === "NO_SE_PUEDE_MODIFICAR_ROL_PROTEGIDO") {
        return res.status(403).json({
          success: false,
          message: "No se puede modificar un rol protegido por el sistema",
          data: null,
        });
      }
      res.status(500).json({
        success: false,
        message: "Error al cambiar estado de rol",
        data: null,
      });
    }
  },
};

module.exports = rolController;
