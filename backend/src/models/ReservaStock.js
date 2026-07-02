const pool = require('../config/database');

pool.query(`
  CREATE TABLE IF NOT EXISTS Reserva_Stock (
    reserva_id    INT         NOT NULL AUTO_INCREMENT,
    cotizacion_id INT         NOT NULL,
    articulo_id   INT         NOT NULL,
    marca_id      INT         NOT NULL,
    cantidad      INT         NOT NULL,
    estado        VARCHAR(20) NOT NULL DEFAULT 'activa',
    fecha_reserva TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre  TIMESTAMP   NULL,
    PRIMARY KEY (reserva_id),
    INDEX idx_rs_cotizacion (cotizacion_id),
    INDEX idx_rs_articulo   (articulo_id, marca_id),
    CONSTRAINT fk_rs_articulo FOREIGN KEY (articulo_id) REFERENCES Articulos(articulo_id)     ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT fk_rs_marca    FOREIGN KEY (marca_id)    REFERENCES Marca_Repuesto(marca_id)   ON DELETE RESTRICT ON UPDATE CASCADE
  ) ENGINE=InnoDB
`).catch(() => {});

const ReservaStock = {
  async liberarPorCotizacion(cotizacionId, conn) {
    const [reservas] = await conn.query(
      `SELECT articulo_id, marca_id, cantidad
       FROM Reserva_Stock WHERE cotizacion_id = ? AND estado = 'activa'`,
      [cotizacionId]
    );
    for (const r of reservas) {
      await conn.query(
        `UPDATE Articulo_Marca_Precio
         SET cantidad_reservada = GREATEST(0, cantidad_reservada - ?)
         WHERE articulo_id = ? AND marca_id = ?`,
        [r.cantidad, r.articulo_id, r.marca_id]
      );
    }
    if (reservas.length) {
      await conn.query(
        `UPDATE Reserva_Stock SET estado = 'liberada', fecha_cierre = NOW()
         WHERE cotizacion_id = ? AND estado = 'activa'`,
        [cotizacionId]
      );
    }
    return reservas;
  },

  async consumirPorCotizacion(cotizacionId, conn) {
    const [reservas] = await conn.query(
      `SELECT articulo_id, marca_id, cantidad
       FROM Reserva_Stock WHERE cotizacion_id = ? AND estado = 'activa'`,
      [cotizacionId]
    );
    for (const r of reservas) {
      await conn.query(
        `UPDATE Articulo_Marca_Precio
         SET stock_actual       = GREATEST(0, stock_actual - ?),
             cantidad_reservada = GREATEST(0, cantidad_reservada - ?)
         WHERE articulo_id = ? AND marca_id = ?`,
        [r.cantidad, r.cantidad, r.articulo_id, r.marca_id]
      );
    }
    if (reservas.length) {
      await conn.query(
        `UPDATE Reserva_Stock SET estado = 'consumida', fecha_cierre = NOW()
         WHERE cotizacion_id = ? AND estado = 'activa'`,
        [cotizacionId]
      );
    }
    return reservas;
  },
};

module.exports = ReservaStock;
