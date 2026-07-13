const multer = require("multer");
const path = require("path");
const fs = require("fs");

const asegurarCarpeta = (ruta) => {
  if (!fs.existsSync(ruta)) {
    fs.mkdirSync(ruta, { recursive: true });
  }
};

const storageArticulos = multer.memoryStorage();

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

const storageImagenesCotizaciones = multer.memoryStorage();

const storageIncidencias = multer.diskStorage({
  destination: function (req, file, cb) {
    const ruta = path.join(__dirname, "../../uploads/incidencias");
    asegurarCarpeta(ruta);
    cb(null, ruta);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "inc-" + uniqueSuffix + path.extname(file.originalname));
  },
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

// Filtro solo imágenes (sin PDF)
const fileFilterImagenes = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"), false);
  }
};

// Middlewares
const uploadArticulos = multer({
  storage: storageArticulos,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilterImagenes,
});

const uploadCotizaciones = multer({
  storage: storageCotizaciones,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

const uploadImagenesCotizacion = multer({
  storage: storageImagenesCotizaciones,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilterImagenes,
});

const uploadIncidencias = multer({
  storage: storageIncidencias,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilterImagenes,
});

module.exports = {
  uploadArticulos,
  uploadCotizaciones,
  uploadImagenesCotizacion,
  uploadIncidencias,
};
