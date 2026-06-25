const pool = require('../config/database');

pool.query(`
  CREATE TABLE IF NOT EXISTS Lote (
    lote_id           INT           NOT NULL AUTO_INCREMENT,
    articulo_id       INT           NOT NULL,
    marca_id          INT           NOT NULL,
    numero_lote       VARCHAR(50)   NULL,
    cantidad_inicial  INT           NOT NULL DEFAULT 0,
    cantidad_actual   INT           NOT NULL DEFAULT 0,
    fecha_vencimiento DATE          NULL,
    fecha_ingreso     DATE          NOT NULL,
    observaciones     VARCHAR(200)  NULL,
    registrado_por    VARCHAR(100)  NULL,
    activo            TINYINT(1)    NOT NULL DEFAULT 1,
    PRIMARY KEY (lote_id),
    INDEX idx_lote_articulo (articulo_id, marca_id),
    INDEX idx_lote_vencimiento (fecha_vencimiento),
    CONSTRAINT fk_lote_articulo FOREIGN KEY (articulo_id) REFERENCES Articulos(articulo_id)   ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT fk_lote_marca    FOREIGN KEY (marca_id)    REFERENCES Marca_Repuesto(marca_id) ON DELETE RESTRICT ON UPDATE CASCADE
  ) ENGINE=InnoDB
`).catch(() => {});

const Lote = {
  async listarPorArticulo(articuloId) {
    const [rows] = await pool.query(
      `SELECT l.lote_id, l.marca_id, m.nombre AS marca_nombre,
              l.numero_lote, l.cantidad_inicial, l.cantidad_actual,
              l.fecha_vencimiento, l.fecha_ingreso, l.observaciones,
              l.registrado_por, l.activo
       FROM Lote l
       JOIN Marca_Repuesto m ON m.marca_id = l.marca_id
       WHERE l.articulo_id = ? AND l.activo = 1
       ORDER BY l.fecha_vencimiento ASC, l.fecha_ingreso ASC`,
      [articuloId]
    );
    return rows;
  },

  async crear(articuloId, { marca_id, numero_lote, cantidad, fecha_vencimiento, fecha_ingreso, observaciones, registrado_por }) {
    const hoy = new Date().toISOString().slice(0, 10);
    const [result] = await pool.query(
      `INSERT INTO Lote
         (articulo_id, marca_id, numero_lote, cantidad_inicial, cantidad_actual,
          fecha_vencimiento, fecha_ingreso, observaciones, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        articuloId, marca_id,
        numero_lote  || null,
        cantidad, cantidad,
        fecha_vencimiento || null,
        fecha_ingreso || hoy,
        observaciones || null,
        registrado_por || null,
      ]
    );
    return result.insertId;
  },

  async actualizar(articuloId, loteId, { cantidad_actual, observaciones }) {
    const [result] = await pool.query(
      `UPDATE Lote
       SET cantidad_actual = ?, observaciones = ?
       WHERE lote_id = ? AND articulo_id = ?`,
      [cantidad_actual, observaciones || null, loteId, articuloId]
    );
    return result.affectedRows > 0;
  },

  async desactivar(articuloId, loteId) {
    const [result] = await pool.query(
      `UPDATE Lote SET activo = 0 WHERE lote_id = ? AND articulo_id = ?`,
      [loteId, articuloId]
    );
    return result.affectedRows > 0;
  },

  async listarPorVencer(dias = 30) {
    const [rows] = await pool.query(
      `SELECT l.lote_id, l.numero_lote, l.cantidad_actual,
              l.fecha_vencimiento, l.fecha_ingreso,
              a.articulo_id, a.nombre AS articulo_nombre, a.codigo_interno,
              m.marca_id, m.nombre AS marca_nombre
       FROM Lote l
       JOIN Articulos a       ON a.articulo_id = l.articulo_id
       JOIN Marca_Repuesto m  ON m.marca_id    = l.marca_id
       WHERE l.activo = 1
         AND l.fecha_vencimiento IS NOT NULL
         AND l.cantidad_actual > 0
         AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY l.fecha_vencimiento ASC`,
      [dias]
    );
    return rows;
  },
};

module.exports = Lote;
