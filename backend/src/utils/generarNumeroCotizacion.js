const pool = require("../config/database");
/**
 * Genera un nuevo número de cotización con formato COT-2026-000001
 * @returns {Promise<string>} - Número formateado
 */
async function generarNumeroCotizacion() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const anio = new Date().getFullYear();
    await connection.execute(
      `INSERT IGNORE INTO Correlativo_Cotizacion (anio, ultimo_numero) 
             VALUES (?, 0)`,
      [anio],
    );
    const [updateResult] = await connection.execute(
      `UPDATE Correlativo_Cotizacion 
             SET ultimo_numero = ultimo_numero + 1 
             WHERE anio = ?`,
      [anio],
    );
    const [rows] = await connection.execute(
      `SELECT ultimo_numero FROM Correlativo_Cotizacion WHERE anio = ?`,
      [anio],
    );
    if (rows.length === 0) {
      throw new Error("No se pudo obtener el correlativo");
    }
    const numero = rows[0].ultimo_numero;

    const numeroFormateado = `COT-${anio}-${String(numero).padStart(6, "0")}`;

    await connection.commit();

    return numeroFormateado;
  } catch (error) {
    await connection.rollback();
    console.error("Error al generar número de cotización:", error);
    throw new Error("No se pudo generar el número de cotización");
  } finally {
    connection.release();
  }
}

module.exports = generarNumeroCotizacion;
