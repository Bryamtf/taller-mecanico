const generarCodigoIncidencia = async (conn) => {
  const anio = new Date().getFullYear();

  await conn.query(
    `INSERT INTO Correlativo_Incidencia (anio, ultimo_numero)
     VALUES (?, 1)
     ON DUPLICATE KEY UPDATE ultimo_numero = ultimo_numero + 1`,
    [anio]
  );

  const [[row]] = await conn.query(
    `SELECT ultimo_numero FROM Correlativo_Incidencia WHERE anio = ?`,
    [anio]
  );

  const numero = String(row.ultimo_numero).padStart(6, '0');
  return `INC-${anio}-${numero}`;
};

module.exports = generarCodigoIncidencia;
