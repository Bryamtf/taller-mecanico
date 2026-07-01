const pool = require("../config/database");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imagenService = {
  validar(file) {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valido: false,
        error: "La imagen excede el tamaño máximo de 5 MB",
      };
    }
    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!formatosPermitidos.includes(file.mimetype)) {
      return {
        valido: false,
        error: "Formato no permitido. Use JPG, PNG o WEBP",
      };
    }
    return { valido: true, error: null };
  },

  async subirACloudinary(buffer, cotizacionId, orden) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `autonort/cotizaciones/${cotizacionId}`,
          public_id: `img_${orden}`,
          overwrite: true,
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  },

  async eliminarDeCloudinary(rutaArchivo) {
    try {
      const matches = rutaArchivo.match(/autonort\/cotizaciones\/\d+\/img_\d+/);
      if (!matches) return;
      await cloudinary.uploader.destroy(matches[0]);
    } catch (error) {
      console.error("Error al eliminar imagen de Cloudinary:", error);
    }
  },

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

      const resultado = await this.subirACloudinary(
        file.buffer,
        cotizacionId,
        orden,
      );

      const imagenId = await this.registrarEnBD(
        cotizacionId,
        resultado.secure_url,
        orden,
        subidoPor,
        conn,
        descripcion,
      );

      resultados.push({
        imagen_id: imagenId,
        ruta: resultado.secure_url,
        orden: orden,
        descripcion,
      });
    }

    return resultados;
  },

  async eliminarCarpetaImagenes(cotizacionId) {
    try {
      await cloudinary.api.delete_resources_by_prefix(
        `autonort/cotizaciones/${cotizacionId}/`,
      );
      await cloudinary.api.delete_folder(
        `autonort/cotizaciones/${cotizacionId}`,
      );
    } catch (error) {
      console.error("Error al eliminar carpeta de Cloudinary:", error);
    }
  },
};
module.exports = imagenService;
