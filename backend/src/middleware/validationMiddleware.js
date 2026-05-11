const { validationResult, body } = require("express-validator");

// Middleware para validar resultados
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// Validaciones específicas para Cotizaciones
const validateCotizacion = [
  body("cliente_id").isInt().withMessage("Cliente inválido"),
  body("vehiculo_id").isInt().withMessage("Vehículo inválido"),
  body("detalles")
    .isArray({ min: 1 })
    .withMessage("Debe tener al menos un detalle"),
  body("detalles.*.cantidad")
    .isFloat({ min: 0.01 })
    .withMessage("Cantidad inválida"),
  body("detalles.*.precio_unitario")
    .isFloat({ min: 0 })
    .withMessage("Precio inválido"),
  validateResult,
];

const validateEstado = [
  body("estado")
    .isIn(["borrador", "pendiente", "aprobada", "rechazada", "vencida"])
    .withMessage("Estado no válido"),
  validateResult,
];

module.exports = {
  validateResult,
  validateCotizacion,
  validateEstado,
};
