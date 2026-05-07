const app = require("./src/app");
const http = require("http");
const socketIO = require("socket.io");

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

// Socket.io opcional para notificaciones
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔌 Cliente desconectado:", socket.id);
  });
});

app.set("io", io);

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
