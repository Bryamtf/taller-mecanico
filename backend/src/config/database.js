const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "taller_user",
  password: process.env.DB_PASSWORD || "taller123",
  database: process.env.DB_NAME || "TallerMecanico",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Función para probar conexión (NO ejecutar automáticamente)
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conectado a MySQL");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Error conectando a MySQL:", error.message);
    return false;
  }
};

// Exportar pool y función de prueba
module.exports = { pool, testConnection };
