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

//Validaciones para artículo
const validateArticulo = [
    body("nombre")
        .trim().notEmpty().withMessage("El nombre del artículo es obligatorio")
        .isLength({ max: 150 }).withMessage("El nombre no puede exceder los 150 caracteres"),
    body("tipo")
        .isIn(['repuesto', 'consumible', 'servicio']).withMessage("El tipo de artículo no es válido"),
    body("unidad_medida")
        .notEmpty().withMessage("La unidad de medida es obligatoria"),
    body("stock_minimo")
        .optional()
        .isInt({ min: 0 }).withMessage("El stock mínimo debe ser un número entero positivo"),
    validateResult,
];

//Validaciones para marca
const validateMarca = [
  body("nombre")
    .exists().withMessage("El nombre de la marca es requerido")
    .isString().withMessage("El nombre debe ser un texto válido")
    .trim() // Elimina espacios en blanco al inicio y al final ("  BOSCH  " -> "BOSCH")
    .notEmpty().withMessage("El nombre de la marca no puede estar vacío")
    .isLength({ max: 50 }).withMessage("El nombre no puede exceder los 50 caracteres"),
  validateResult,
];

const validateEstado = [
  body("estado")
    .isIn(["borrador", "pendiente", "aprobada", "rechazada", "vencida"])
    .withMessage("Estado no válido"),
  validateResult,
];

//Validaciones para vehículo
const validateVehiculo = [
  body("cliente_id").isInt().withMessage("El ID del cliente es obligatorio y debe ser un número válido"),
  body("placa")
    .isString().trim().notEmpty().withMessage("La placa es obligatoria")
    .isLength({ min: 6, max: 10 }).withMessage("Formato de placa inválido"),
  validateResult,
];

module.exports = {
  validateResult,
  validateCotizacion,
  validateEstado,
  validateArticulo,
  validateMarca,
  validateVehiculo
};
