const Permiso = require("../models/Permiso");

const permisoController = {
  async listarPermisos(req, res) {
    try {
      const permisos = await Permiso.findAll();

      res.json({
        success: true,
        message: "Permisos listados exitosamente",
        data: { permisos },
      });
    } catch (error) {
      console.error("Error al listar permisos:", error);
      res.status(500).json({
        success: false,
        message: "Error al listar permisos",
        data: null,
      });
    }
  },
};

module.exports = permisoController;
