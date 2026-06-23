import "dotenv/config";
import express from "express";
import emailRoutes from "./routes/email.routes.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json({ limit: "10mb" })); // necesario para el PDF en base64

app.use((req, res, next) => {
  if (req.path === "/health") return next();
  const secret = req.headers["x-internal-secret"];
  if (secret !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: "No autorizado" });
  }
  next();
});

app.use("/api/email", emailRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "autonort-notifications" });
});

app.listen(PORT, () => {
  console.log(`[Autonort Notifications] Servicio corriendo en puerto ${PORT}`);
  console.log(`[Autonort Notifications] Ambiente: ${process.env.NODE_ENV}`);
});
