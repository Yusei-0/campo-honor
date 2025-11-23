const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const matchmakingHandler = require("./src/handlers/matchmakingHandler");
const gameHandler = require("./src/handlers/gameHandler");

// Enable CORS for frontend connection
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("<h1>Medieval Strategy Game Backend</h1>");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register Handlers
  matchmakingHandler(io, socket);
  gameHandler(io, socket);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

let PORT = 3000;

const startServer = (port) => {
  server
    .listen(port, () => {
      console.log(`listening on *:${port}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} is busy, trying ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error("Server error:", err);
      }
    });
};

startServer(PORT);
