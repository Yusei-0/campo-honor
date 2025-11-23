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
// Active Games and Pending Matches
let pendingMatches = {}; // matchId -> { player1: {id, confirmed}, player2: {id, confirmed} }
let activeGames = {}; // gameId -> gameData

const DECK_IDS = [
  "card_knight_01",
  "card_archer_01",
  "card_mage_01",
  "card_shield_01",
  "card_lancer_01",
  "card_catapult_01",
  "card_healer_01",
];

const shuffleDeck = (deck) => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

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
      const matchId = `match_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      console.log(`Match found: ${player1.name} vs ${player2.name}`);

      // Store pending match
      pendingMatches[matchId] = {
        player1: {
          id: player1.id,
          name: player1.name,
          socket: player1.socket,
          confirmed: false,
        },
        player2: {
          id: player2.id,
          name: player2.name,
          socket: player2.socket,
          confirmed: false,
        },
      };

      // Notify players
      player1.socket.emit("match_found", { matchId, opponent: player2.name });
      player2.socket.emit("match_found", { matchId, opponent: player1.name });
    }
  });

  socket.on("leave_queue", () => {
    console.log(`User ${socket.id} left queue`);
    matchmakingQueue = matchmakingQueue.filter(
      (player) => player.id !== socket.id
    );
  });

  socket.on("confirm_match", (matchId) => {
    const match = pendingMatches[matchId];
    if (!match) return;

    if (match.player1.id === socket.id) match.player1.confirmed = true;
    if (match.player2.id === socket.id) match.player2.confirmed = true;

    // Check if both confirmed
    if (match.player1.confirmed && match.player2.confirmed) {
      console.log(`Match ${matchId} confirmed! Starting game...`);

      // Initialize Game
      const gameId = matchId; // Reuse matchId as gameId

      // Deal cards
      const deck1 = shuffleDeck(DECK_IDS);
      const deck2 = shuffleDeck(DECK_IDS);
      const hand1 = deck1.slice(0, 5);
      const hand2 = deck2.slice(0, 5);

      activeGames[gameId] = {
        player1: {
          ...match.player1,
          hand: hand1,
          deck: deck1.slice(5),
          energy: 10,
        },
        player2: {
          ...match.player2,
          hand: hand2,
          deck: deck2.slice(5),
          energy: 10,
        },
        turn: match.player1.id, // Player 1 starts
      };

      // Emit Game Start
      match.player1.socket.emit("game_start", {
        gameId,
        hand: hand1,
        energy: 10,
        opponent: match.player2.name,
        turn: true, // It's your turn
      });

      match.player2.socket.emit("game_start", {
        gameId,
        hand: hand2,
        energy: 10,
        opponent: match.player1.name,
        turn: false,
      });

      delete pendingMatches[matchId];
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Remove from queue if present
    matchmakingQueue = matchmakingQueue.filter(
      (player) => player.id !== socket.id
    );
    // Handle pending matches cleanup? (For POC we skip complex cleanup)
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
