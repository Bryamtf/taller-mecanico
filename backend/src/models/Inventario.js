const pool = require('../config/database');

const Inventario = {

  async obtenerInventarioCompleto({ pagina = 1, limite = 10, busqueda = '', tipo = '' } = {}) {
    const offset = (pagina - 1) * limite;
    const filtro = `%${busqueda}%`;

    const condiciones = ['a.activo = 1', '(a.nombre LIKE ? OR a.codigo_interno LIKE ? OR a.codigo_barras LIKE ?)'];
    const params      = [filtro, filtro, filtro];

    if (tipo) {
      condiciones.push('a.tipo = ?');
      params.push(tipo);
    }

    const where = condiciones.join(' AND ');

    const [rows] = await pool.query(
      `SELECT
          a.articulo_id, a.codigo_interno, a.codigo_barras, a.nombre,
          a.tipo, a.unidad_medida, a.stock_minimo, a.activo,
          COALESCE(SUM(amp.stock_actual), 0)        AS stock_total,
          COUNT(DISTINCT amp.marca_id)              AS total_marcas,
          GROUP_CONCAT(DISTINCT m.nombre ORDER BY m.nombre SEPARATOR ', ') AS marcas,
          (SELECT img.ruta_archivo FROM Imagenes img
           WHERE img.articulo_id = a.articulo_id AND img.tipo = 'articulo'
           ORDER BY img.orden ASC LIMIT 1)          AS imagen_principal
       FROM Articulos a
       LEFT JOIN Articulo_Marca_Precio amp ON amp.articulo_id = a.articulo_id
       LEFT JOIN Marca_Repuesto m           ON m.marca_id     = amp.marca_id
       WHERE ${where}
       GROUP BY a.articulo_id, a.codigo_interno, a.codigo_barras, a.nombre,
                a.tipo, a.unidad_medida, a.stock_minimo, a.activo
       ORDER BY a.nombre ASC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT a.articulo_id) AS total
       FROM Articulos a WHERE ${where}`,
      params
    );

    const [resumen] = await pool.query(
      `SELECT COUNT(DISTINCT a.articulo_id)      AS totalItems,
              COALESCE(SUM(amp.stock_actual), 0) AS stockTotal
       FROM Articulos a
       LEFT JOIN Articulo_Marca_Precio amp ON amp.articulo_id = a.articulo_id
       WHERE a.activo = 1`
    );

    return {
      resumen:      { totalItems: Number(resumen[0].totalItems), stockTotal: Number(resumen[0].stockTotal) },
      productos:    rows,
      total:        Number(total),
      pagina,
      totalPaginas: Math.ceil(Number(total) / limite),
    };
  },

  async obtenerArticuloConMarcas(id) {
    const [rows] = await pool.query(
      `SELECT
          a.articulo_id, a.nombre, a.descripcion, a.codigo_barras, a.codigo_interno,
          a.tipo, a.unidad_medida, a.stock_minimo, a.alerta_stock, a.activo,
          amp.marca_id, amp.stock_actual, amp.precio_venta, amp.precio_costo,
          m.nombre AS marca_nombre,
          i.imagen_id, i.ruta_archivo AS imagen_ruta, i.orden AS imagen_orden
       FROM Articulos a
       LEFT JOIN Articulo_Marca_Precio amp ON amp.articulo_id = a.articulo_id
       LEFT JOIN Marca_Repuesto m           ON m.marca_id     = amp.marca_id
       LEFT JOIN Imagenes i                 ON i.articulo_id  = a.articulo_id AND i.tipo = 'articulo'
       WHERE a.articulo_id = ?
       ORDER BY amp.marca_id ASC, i.orden ASC`,
      [id]
    );

    if (!rows.length) return null;

    // Agrupa marcas e imágenes en arrays, eliminando duplicados
    const articulo = {
      articulo_id:   rows[0].articulo_id,
      nombre:        rows[0].nombre,
      descripcion:   rows[0].descripcion,
      codigo_barras: rows[0].codigo_barras,
      codigo_interno:rows[0].codigo_interno,
      tipo:          rows[0].tipo,
      unidad_medida: rows[0].unidad_medida,
      stock_minimo:  rows[0].stock_minimo,
      alerta_stock:  rows[0].alerta_stock,
      activo:        rows[0].activo,
      marcas:        [],
      imagenes:      [],
    };

    const marcasMap   = new Map();
    const imagenesMap = new Map();

    for (const row of rows) {
      if (row.marca_id && !marcasMap.has(row.marca_id)) {
        marcasMap.set(row.marca_id, {
          marca_id:    row.marca_id,
          marca_nombre:row.marca_nombre,
          stock_actual:row.stock_actual,
          precio_venta:row.precio_venta,
          precio_costo:row.precio_costo,
        });
      }
      if (row.imagen_id && !imagenesMap.has(row.imagen_id)) {
        imagenesMap.set(row.imagen_id, {
          imagen_id:  row.imagen_id,
          ruta:       row.imagen_ruta,
          orden:      row.imagen_orden,
        });
      }
    }

    articulo.marcas   = [...marcasMap.values()];
    articulo.imagenes = [...imagenesMap.values()].sort((a, b) => a.orden - b.orden);

    return articulo;
  },

  async listarArticulos() {
    const [rows] = await pool.query(
      `SELECT a.articulo_id, a.nombre, a.codigo_interno, a.tipo, a.unidad_medida,
              amp.precio_venta, amp.stock_actual, m.nombre AS marca_nombre
       FROM Articulos a
       LEFT JOIN Articulo_Marca_Precio amp ON amp.articulo_id = a.articulo_id
       LEFT JOIN Marca_Repuesto m           ON m.marca_id     = amp.marca_id
       WHERE a.activo = 1
       ORDER BY a.nombre ASC`
    );
    return rows;
  },

  async buscarArticulos(termino) {
    const like = `%${termino}%`;
    const [rows] = await pool.query(
      `SELECT a.articulo_id, a.nombre, a.codigo_interno, a.tipo, a.unidad_medida,
              amp.precio_venta, amp.stock_actual, m.nombre AS marca_nombre
       FROM Articulos a
       LEFT JOIN Articulo_Marca_Precio amp ON amp.articulo_id = a.articulo_id
       LEFT JOIN Marca_Repuesto m           ON m.marca_id     = amp.marca_id
       WHERE a.activo = 1 AND (a.nombre LIKE ? OR a.codigo_interno LIKE ?)
       ORDER BY a.nombre ASC
       LIMIT 20`,
      [like, like]
    );
    return rows;
  },
};

module.exports = Inventario;
