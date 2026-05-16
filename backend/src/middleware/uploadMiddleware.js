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
        const ruta = path.join(__dirname, '../../uploads/articulos');
        asegurarCarpeta(ruta);
        cb(null, ruta);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'art-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Formato no válido. Solo se permiten imágenes.'), false);
    }
};

const uploadArticulos = multer({ storage: storageArticulos, fileFilter: fileFilter });

module.exports = {
    uploadArticulos
};