const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (imágenes)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const authRoutes = require("./routes/auth");
const citaRoutes = require("./routes/citas");
const clienteRoutes = require("./routes/clientes");
const cotizacionRoutes = require("./routes/cotizaciones");
const inventarioRoutes = require("./routes/inventario");
const articulosRoutes = require("./routes/articulos")
const usuarioRoutes = require("./routes/usuarios");
const rolRoutes = require("./routes/roles");
const permisoRoutes = require("./routes/permisos");
const comprobanteRoutes = require("./routes/comprobantes");
const consultaPlacaRoutes = require("./routes/consultaPlaca");
const marcaRoutes = require("./routes/marca");
const vehiculoRoutes = require("./routes/vehiculo");

app.use("/api/auth", authRoutes);
app.use("/api/citas", citaRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/cotizaciones", cotizacionRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/articulos",articulosRoutes)
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/roles", rolRoutes);
app.use("/api/permisos", permisoRoutes);
app.use("/api/comprobantes", comprobanteRoutes);
app.use("/api/consulta-placa", consultaPlacaRoutes);
app.use("/api/marcas",marcaRoutes);
app.use("/api/vehiculos",vehiculoRoutes);

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "MIAUTONORT API funcionando" });
});

// Middleware de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
});

module.exports = app;
