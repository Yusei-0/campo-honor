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

      // Initialize Board (7x8)
      const {
        BOARD_WIDTH,
        BOARD_HEIGHT,
        TOWER_HP,
        TOWER_POSITIONS,
        SPAWN_ZONES,
      } = require("../constants/game");
      const cardsData = require("../../../card.json");

      const board = Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null));

      // Place Single Tower for each player
      board[TOWER_POSITIONS.player1.r][TOWER_POSITIONS.player1.c] = {
        type: "tower",
        owner: match.player1.id,
        hp: TOWER_HP,
        maxHp: TOWER_HP,
      };

      board[TOWER_POSITIONS.player2.r][TOWER_POSITIONS.player2.c] = {
        type: "tower",
        owner: match.player2.id,
        hp: TOWER_HP,
        maxHp: TOWER_HP,
      };

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
        cardsData: cardsData, // Store card data for reference
      };

      const emitGameUpdate = (game) => {
        const commonData = {
          gameId: game.id,
          board: game.board,
          player1Id: game.player1.id,
          player2Id: game.player2.id,
        };

        io.to(game.player1.socket.id).emit("game_update", {
          ...commonData,
          hand: game.player1.hand,
          energy: game.player1.energy,
          turn: game.turn === game.player1.id,
          opponent: game.player2.name,
        });
        io.to(game.player2.socket.id).emit("game_update", {
          ...commonData,
          hand: game.player2.hand,
          energy: game.player2.energy,
          turn: game.turn === game.player2.id,
          opponent: game.player1.name,
        });
      };

      // Initial Emit
      emitGameUpdate(activeGames[gameId]);

      // Emit game_start for navigation
      const startCommon = {
        gameId: gameId,
        board: board,
        player1Id: match.player1.id,
        player2Id: match.player2.id,
      };

      match.player1.socket.emit("game_start", {
        ...startCommon,
        hand: hand1,
        energy: 10,
        turn: true,
        opponent: match.player2.name,
      });

      match.player2.socket.emit("game_start", {
        ...startCommon,
        hand: hand2,
        energy: 10,
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
