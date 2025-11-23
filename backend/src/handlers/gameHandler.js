const { activeGames } = require("../state/gameState");

module.exports = (io, socket) => {
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

  socket.on("summon_unit", ({ gameId, cardIndex, target }) => {
    const game = activeGames[gameId];
    if (!game) return;

    const { SPAWN_ZONES } = require("../constants/game");
    const isPlayer1 = socket.id === game.player1.id;
    const player = isPlayer1 ? game.player1 : game.player2;

    // Validation
    if (game.turn !== socket.id) return; // Not your turn
    if (cardIndex < 0 || cardIndex >= player.hand.length) return; // Invalid card

    // Validate spawn zone
    const validRow = isPlayer1 ? SPAWN_ZONES.player1 : SPAWN_ZONES.player2;
    if (target.r !== validRow) return;
    if (target.c < 0 || target.c >= game.board[0].length) return; // Out of bounds
    if (game.board[target.r][target.c] !== null) return; // Occupied

    const cardId = player.hand[cardIndex];

    // Load real card stats
    const cardData = game.cardsData.find((c) => c.id === cardId);
    if (!cardData) return; // Card not found

    const cost = cardData.cost;
    if (player.energy < cost) return;

    // Execute Summon
    player.energy -= cost;
    player.hand.splice(cardIndex, 1); // Remove card

    game.board[target.r][target.c] = {
      type: "unit",
      owner: socket.id,
      id: cardId,
      hp: cardData.maxHp,
      maxHp: cardData.maxHp,
      attack: cardData.attack,
      defense: cardData.defense,
      range: cardData.range,
      speed: cardData.speed,
      isRanged: cardData.isRanged,
      hasMoved: false,
      hasAttacked: false,
    };

    emitGameUpdate(game);
  });

  socket.on("move_unit", ({ gameId, from, to }) => {
    const game = activeGames[gameId];
    if (!game) return;

    // Validation
    if (game.turn !== socket.id) return;
    const unit = game.board[from.r][from.c];
    if (!unit || unit.owner !== socket.id) return;
    if (unit.type !== "unit") return; // Can't move towers
    if (unit.hasMoved) return; // Already moved this turn
    if (game.board[to.r][to.c] !== null) return; // Occupied

    // Distance Check (Manhattan <= unit.speed)
    const dist = Math.abs(from.r - to.r) + Math.abs(from.c - to.c);
    if (dist > unit.speed) return;

    // Execute Move
    unit.hasMoved = true;
    game.board[to.r][to.c] = unit;
    game.board[from.r][from.c] = null;

    emitGameUpdate(game);
  });

  socket.on("attack_unit", ({ gameId, from, to }) => {
    const game = activeGames[gameId];
    if (!game) return;

    // Validation
    if (game.turn !== socket.id) return;
    const attacker = game.board[from.r][from.c];
    if (!attacker || attacker.owner !== socket.id) return;
    if (attacker.type !== "unit") return;
    if (attacker.hasAttacked) return; // Already attacked this turn

    const target = game.board[to.r][to.c];
    if (!target || target.owner === socket.id) return; // No target or friendly fire

    // Range Check (Manhattan distance)
    const dist = Math.abs(from.r - to.r) + Math.abs(from.c - to.c);
    if (dist > attacker.range) return;

    // Calculate Damage
    const damage = Math.max(1, attacker.attack - (target.defense || 0));
    target.hp -= damage;

    // Mark as attacked
    attacker.hasAttacked = true;

    // Remove if dead
    if (target.hp <= 0) {
      game.board[to.r][to.c] = null;

      // Check for victory (tower destroyed)
      if (target.type === "tower") {
        const winner = socket.id;
        const loser =
          winner === game.player1.id ? game.player2.id : game.player1.id;

        io.to(winner).emit("game_over", {
          result: "victory",
          reason: "Torre enemiga destruida",
        });
        io.to(loser).emit("game_over", {
          result: "defeat",
          reason: "Tu torre fue destruida",
        });

        // Clean up game
        delete activeGames[gameId];
        return;
      }
    }

    emitGameUpdate(game);
  });

  socket.on("end_turn", ({ gameId }) => {
    const game = activeGames[gameId];
    if (!game) return;

    // Validation
    if (game.turn !== socket.id) return;

    // Reset unit states for current player
    for (let r = 0; r < game.board.length; r++) {
      for (let c = 0; c < game.board[r].length; c++) {
        const cell = game.board[r][c];
        if (cell && cell.type === "unit" && cell.owner === socket.id) {
          cell.hasMoved = false;
          cell.hasAttacked = false;
        }
      }
    }

    // Switch turn
    game.turn =
      game.turn === game.player1.id ? game.player2.id : game.player1.id;

    emitGameUpdate(game);
  });
};
