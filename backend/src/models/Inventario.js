const pool = require("../config/database");

const Inventario = {
  async obtenerInventarioCompleto() {
    const query = `
            SELECT 
                a.articulo_id, a.codigo_interno, a.codigo_barras, a.nombre, a.tipo AS categoria,
                a.stock_minimo, 
                m.nombre AS marca_nombre, 
                amp.marca_id, amp.stock_actual, amp.precio_venta, amp.precio_costo,
                IF(COUNT(img.imagen_id) > 0, 
                   JSON_ARRAYAGG(
                       JSON_OBJECT('imagen_id', img.imagen_id, 'ruta', img.ruta_archivo, 'orden', img.orden)
                   ), 
                   JSON_ARRAY()
                ) AS imagenes
            FROM Articulos a
            LEFT JOIN Articulo_Marca_Precio amp ON a.articulo_id = amp.articulo_id
            LEFT JOIN Marca_Repuesto m ON amp.marca_id = m.marca_id
            LEFT JOIN Imagenes img ON a.articulo_id = img.articulo_id AND img.tipo = 'articulo'
            WHERE a.activo = 1
            GROUP BY 
                a.articulo_id, a.codigo_interno, a.codigo_barras, a.nombre, a.tipo, 
                a.stock_minimo, m.nombre, amp.marca_id, amp.stock_actual, amp.precio_venta, amp.precio_costo
        `;

    const [rows] = await pool.query(query);

    const inventarioOrdenado = rows.map((row) => {
      let imagenesArray =
        typeof row.imagenes === "string"
          ? JSON.parse(row.imagenes)
          : row.imagenes;

      if (Array.isArray(imagenesArray)) {
        imagenesArray.sort((a, b) => a.orden - b.orden);
      }

      return {
        ...row,
        imagenes: imagenesArray,
      };
    });

    return inventarioOrdenado;
  },

  // NUEVO: Obtener todos los artículos (para lista de cotización)
  async listarArticulos() {
    const query = `
            SELECT 
                a.articulo_id, 
                a.nombre, 
                a.codigo_interno,
                a.tipo,
                a.unidad_medida,
                amp.precio_venta,
                amp.stock_actual,
                m.nombre as marca_nombre
            FROM Articulos a
            LEFT JOIN Articulo_Marca_Precio amp ON a.articulo_id = amp.articulo_id
            LEFT JOIN Marca_Repuesto m ON amp.marca_id = m.marca_id
            WHERE a.activo = 1
            ORDER BY a.nombre ASC
        `;

    const [rows] = await pool.query(query);
    return rows;
  },

  // NUEVO: Buscar artículos por nombre o código
  async buscarArticulos(termino) {
    const query = `
            SELECT 
                a.articulo_id, 
                a.nombre, 
                a.codigo_interno,
                a.tipo,
                a.unidad_medida,
                amp.precio_venta,
                amp.stock_actual,
                m.nombre as marca_nombre
            FROM Articulos a
            LEFT JOIN Articulo_Marca_Precio amp ON a.articulo_id = amp.articulo_id
            LEFT JOIN Marca_Repuesto m ON amp.marca_id = m.marca_id
            WHERE a.activo = 1 
              AND (a.nombre LIKE ? OR a.codigo_interno LIKE ?)
            ORDER BY a.nombre ASC
            LIMIT 20
        `;

    const searchTerm = `%${termino}%`;
    const [rows] = await pool.query(query, [searchTerm, searchTerm]);
    return rows;
  },

  // NUEVO: Obtener un artículo por ID
  async obtenerPorId(id) {
    const query = `
            SELECT 
                a.articulo_id, 
                a.nombre, 
                a.codigo_interno,
                a.codigo_barras,
                a.tipo,
                a.unidad_medida,
                a.descripcion,
                a.stock_minimo,
                amp.marca_id,
                amp.stock_actual,
                amp.precio_venta,
                amp.precio_costo,
                m.nombre as marca_nombre
            FROM Articulos a
            LEFT JOIN Articulo_Marca_Precio amp ON a.articulo_id = amp.articulo_id
            LEFT JOIN Marca_Repuesto m ON amp.marca_id = m.marca_id
            WHERE a.articulo_id = ? AND a.activo = 1
        `;

    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  },
};

module.exports = Inventario;
