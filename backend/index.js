const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

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

// Matchmaking Queue
let matchmakingQueue = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("find_match", (playerName) => {
    console.log(`User ${playerName} (${socket.id}) looking for match`);

    // Add user to queue
    matchmakingQueue.push({
      id: socket.id,
      name: playerName,
      socket: socket,
    });

    // Check if we can make a match
    if (matchmakingQueue.length >= 2) {
      const player1 = matchmakingQueue.shift();
      const player2 = matchmakingQueue.shift();

      console.log(`Match found: ${player1.name} vs ${player2.name}`);

      // Notify players
      player1.socket.emit("match_found", { opponent: player2.name });
      player2.socket.emit("match_found", { opponent: player1.name });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Remove from queue if present
    matchmakingQueue = matchmakingQueue.filter(
      (player) => player.id !== socket.id
    );
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
