const fs = require("fs");
const path = require("path");
const pool = require("../config/database");

const imagenService = {
  /**
   * Validar archivo de imagen
   * @param {Object} file - Archivo de multer
   * @returns {Object} { valido: boolean, error: string }
   */
  validar(file) {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valido: false,
        error: "La imagen excede el tamaño máximo de 5 MB",
      };
    }

    // validar formatos permitidos
    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!formatosPermitidos.includes(file.mimetype)) {
      return {
        valido: false,
        error: "Formato no permitido. Use JPG, PNG o WEBP",
      };
    }
    return { valido: true, error: null };
  },
  /**
   * Generar nombre único para la imagen
   * @param {number} orden - Número de orden (1, 2, 3...)
   * @param {string} extension - Extensión del archivo
   * @returns {string} - Nombre generado
   */
  generarNombre(orden, extension) {
    const timestamp = Date.now();
    return `img_${orden}.${extension}`;
  },

  /**
   * Obtener extensión del archivo
   * @param {string} mimetype - Tipo MIME
   * @returns {string} - Extensión
   */
  getExtension(mimetype) {
    const extensiones = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    return extensiones[mimetype] || "jpg";
  },
  /**
   * Guardar imagen en disco
   * @param {Object} file - Archivo de multer
   * @param {number} cotizacionId - ID de la cotización
   * @param {number} orden - Número de orden
   * @returns {Promise<string>} - Ruta relativa del archivo guardado
   */
  async guardarEnDisco(file, cotizacionId, orden) {
    const dir = path.join(
      __dirname,
      `../../uploads/cotizaciones/${cotizacionId}/imagenes`,
    );
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const extension = this.getExtension(file.mimetype);
    const nombre = this.generarNombre(orden, extension);
    const rutaAbsoluta = path.join(dir, nombre);
    const rutaRelativa = `/uploads/cotizaciones/${cotizacionId}/imagenes/${nombre}`;

    // Guardar archivo
    fs.writeFileSync(rutaAbsoluta, file.buffer);

    return rutaRelativa;
  },
  /**
   * Registrar imagen en la base de datos
   * @param {number} cotizacionId - ID de la cotización
   * @param {string} ruta - Ruta relativa del archivo
   * @param {number} orden - Número de orden
   * @param {string} subidoPor - Username de quien sube
   * @param {Object} conn - Conexión de BD (para transacción)
   * @returns {Promise<number>} - ID de la imagen insertada
   */
  async registrarEnBD(
    cotizacionId,
    ruta,
    orden,
    subidoPor,
    conn,
    descripcion = null,
  ) {
    const [result] = await conn.execute(
      `INSERT INTO Imagenes (
                cotizacion_id, ruta_archivo, tipo, visible_cliente, orden, subido_por, descripcion
            ) VALUES (?, ?, 'diagnostico', 1, ?, ?, ?)`,
      [cotizacionId, ruta, orden, subidoPor, descripcion],
    );
    return result.insertId;
  },
  /**
   * Procesar múltiples imágenes (validar, guardar, registrar)
   * @param {Array} files - Archivos de multer
   * @param {number} cotizacionId - ID de la cotización
   * @param {string} subidoPor - Username de quien sube
   * @param {Object} conn - Conexión de BD
   * @returns {Promise<Array>} - Lista de rutas guardadas
   */
  async procesarImagenes(
    files,
    cotizacionId,
    subidoPor,
    conn,
    ordenInicial = 0,
    descripciones = [],
  ) {
    const resultados = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const orden = ordenInicial + i + 1;
      const descripcion = descripciones[i] || null;

      const validacion = this.validar(file);
      if (!validacion.valido) {
        throw new Error(`Imagen ${orden}: ${validacion.error}`);
      }

      const ruta = await this.guardarEnDisco(file, cotizacionId, orden);

      const imagenId = await this.registrarEnBD(
        cotizacionId,
        ruta,
        orden,
        subidoPor,
        conn,
        descripcion,
      );

      resultados.push({
        imagen_id: imagenId,
        ruta: ruta,
        orden: orden,
        descripcion,
      });
    }

    return resultados;
  },
  /**
   * Eliminar carpeta de imágenes de una cotización
   * @param {number} cotizacionId - ID de la cotización
   */
  eliminarCarpetaImagenes(cotizacionId) {
    const dir = path.join(
      __dirname,
      `../../uploads/cotizaciones/${cotizacionId}`,
    );
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
};
module.exports = imagenService;
