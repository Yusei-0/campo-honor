const {
  matchmakingQueue,
  pendingMatches,
  activeGames,
} = require("../state/gameState");
const { DECK_IDS } = require("../constants/cards");
const { shuffleDeck } = require("../utils/deck");

module.exports = (io, socket) => {
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
    // We need to modify the array in place or reassign it in the state module.
    // Since we imported the reference, modifying the array works if it's the same object reference.
    // However, filter returns a new array. We need to be careful.
    // Better approach for state module: export functions to modify state.
    // For now, let's mutate the array in place to keep it simple with current export style
    const index = matchmakingQueue.findIndex((p) => p.id === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
    }
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

      // Initialize Board (10x10)
      const board = Array(10)
        .fill(null)
        .map(() => Array(10).fill(null));

      // Place Towers
      // Player 1 (Bottom, Row 9)
      board[9][1] = { type: "tower", owner: match.player1.id, hp: 3000 };
      board[9][5] = { type: "tower", owner: match.player1.id, hp: 4000 }; // Main Tower
      board[9][8] = { type: "tower", owner: match.player1.id, hp: 3000 };

      // Player 2 (Top, Row 0)
      board[0][1] = { type: "tower", owner: match.player2.id, hp: 3000 };
      board[0][5] = { type: "tower", owner: match.player2.id, hp: 4000 }; // Main Tower
      board[0][8] = { type: "tower", owner: match.player2.id, hp: 3000 };

      activeGames[gameId] = {
        id: gameId,
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
        board: board,
        turn: match.player1.id, // Player 1 starts
      };

      const emitGameUpdate = (game) => {
        io.to(game.player1.socket.id).emit("game_update", {
          gameId: game.id,
          hand: game.player1.hand,
          energy: game.player1.energy,
          board: game.board,
          turn: game.turn === game.player1.id,
          opponent: game.player2.name,
        });
        io.to(game.player2.socket.id).emit("game_update", {
          gameId: game.id,
          hand: game.player2.hand,
          energy: game.player2.energy,
          board: game.board,
          turn: game.turn === game.player2.id,
          opponent: game.player1.name,
        });
      };

      // Initial Emit
      emitGameUpdate(activeGames[gameId]);

      // Emit game_start for navigation
      match.player1.socket.emit("game_start", {
        gameId: gameId,
        hand: hand1,
        energy: 10,
        board: board,
        turn: true,
        opponent: match.player2.name,
      });

      match.player2.socket.emit("game_start", {
        gameId: gameId,
        hand: hand2,
        energy: 10,
        board: board,
        turn: false,
        opponent: match.player1.name,
      });

      delete pendingMatches[matchId];
    }
  });

  socket.on("disconnect", () => {
    // Remove from queue
    const index = matchmakingQueue.findIndex((p) => p.id === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
    }
  });
};
