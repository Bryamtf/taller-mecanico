const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Función auxiliar para crear carpetas si no existen
const asegurarCarpeta = (ruta) => {
    if (!fs.existsSync(ruta)) {
        fs.mkdirSync(ruta, { recursive: true });
    }
};

// 1. Configuración ESPECÍFICA para Artículos
const storageArticulos = multer.diskStorage({
    destination: function (req, file, cb) {
        const ruta = path.join(__dirname, '../../uploads/articulos/temp');
        asegurarCarpeta(ruta);
        cb(null, ruta);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes y PDFs"));
  }
};

const storageCotizaciones = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads/cotizaciones");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `cotizacion-${uniqueSuffix}${ext}`);
  },
});

const uploadArticulos = multer({ 
  storage: storageArticulos, 
  fileFilter: fileFilter 
});

const uploadCotizaciones = multer({
  storage: storageCotizaciones,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

module.exports = {
    uploadArticulos, uploadCotizaciones
};

