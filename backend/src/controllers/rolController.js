const Rol = require("../models/Rol");

const rolController = {
  async listarRoles(req, res) {
    try {
      const roles = await Rol.findAllActive();

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

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: "El nombre del rol es requerido",
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
      const { nombre, descripcion = null } = req.body;

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: "El nombre del rol es requerido",
          data: null,
        });
      }

      const actualizado = await Rol.update(id, { nombre, descripcion });

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

      const status = error.code === "ER_DUP_ENTRY" ? 409 : 500;
      const message =
        error.code === "ER_DUP_ENTRY"
          ? "Ya existe un rol con ese nombre"
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
      res.status(500).json({
        success: false,
        message: "Error al eliminar rol",
        data: null,
      });
    }
  },
};

module.exports = rolController;
