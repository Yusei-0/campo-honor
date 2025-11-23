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

  const switchTurn = (game) => {
    console.log("[TURN SWITCH] Before:", game.turn);
    for (let r = 0; r < game.board.length; r++) {
      for (let c = 0; c < game.board[r].length; c++) {
        const cell = game.board[r][c];
        if (cell && cell.type === "unit" && cell.owner === game.turn) {
          cell.hasMoved = false;
          cell.hasAttacked = false;
        }
      }
    }
    game.turn =
      game.turn === game.player1.id ? game.player2.id : game.player1.id;
    console.log("[TURN SWITCH] After:", game.turn);
  };

  socket.on("summon_unit", ({ gameId, cardIndex, target }) => {
    const game = activeGames[gameId];
    if (!game) return;

    const { SPAWN_ZONES } = require("../constants/game");
    const isPlayer1 = socket.id === game.player1.id;
    const player = isPlayer1 ? game.player1 : game.player2;

    if (game.turn !== socket.id) return;
    if (cardIndex < 0 || cardIndex >= player.hand.length) return;

    const validRow = isPlayer1 ? SPAWN_ZONES.player1 : SPAWN_ZONES.player2;
    if (target.r !== validRow) return;
    if (target.c < 0 || target.c >= game.board[0].length) return;
    if (game.board[target.r][target.c] !== null) return;

    const cardId = player.hand[cardIndex];
    const cardData = game.cardsData.find((c) => c.id === cardId);
    if (!cardData) return;

    const cost = cardData.cost;
    if (player.energy < cost) return;

    player.energy -= cost;
    player.hand.splice(cardIndex, 1);

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

    console.log("[SUMMON] Unit summoned, switching turn");
    switchTurn(game);
    emitGameUpdate(game);
  });

  socket.on("move_unit", ({ gameId, from, to }) => {
    const game = activeGames[gameId];
    if (!game) return;

    if (game.turn !== socket.id) return;
    const unit = game.board[from.r][from.c];
    if (!unit || unit.owner !== socket.id) return;
    if (unit.type !== "unit") return;
    if (unit.hasMoved) return;
    if (game.board[to.r][to.c] !== null) return;

    const dist = Math.abs(from.r - to.r) + Math.abs(from.c - to.c);
    if (dist > unit.speed) return;

    unit.hasMoved = true;
    game.board[to.r][to.c] = unit;
    game.board[from.r][from.c] = null;

    console.log("[MOVE] Unit moved, switching turn");
    switchTurn(game);
    emitGameUpdate(game);
  });

  socket.on("attack_unit", ({ gameId, from, to }) => {
    const game = activeGames[gameId];
    if (!game) return;

    if (game.turn !== socket.id) return;
    const attacker = game.board[from.r][from.c];
    if (!attacker || attacker.owner !== socket.id) return;
    if (attacker.type !== "unit") return;
    if (attacker.hasAttacked) return;

    const target = game.board[to.r][to.c];
    if (!target || target.owner === socket.id) return;

    const dist = Math.abs(from.r - to.r) + Math.abs(from.c - to.c);
    if (dist > attacker.range) return;

    const damage = Math.max(1, attacker.attack - (target.defense || 0));
    target.hp -= damage;

    attacker.hasAttacked = true;

    if (target.hp <= 0) {
      game.board[to.r][to.c] = null;

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

        delete activeGames[gameId];
        return;
      }
    }

    console.log("[ATTACK] Attack completed, switching turn");
    switchTurn(game);
    emitGameUpdate(game);
  });

  socket.on("end_turn", ({ gameId }) => {
    const game = activeGames[gameId];
    if (!game) return;
    if (game.turn !== socket.id) return;

    console.log("[END_TURN] Manual turn end");
    switchTurn(game);
    emitGameUpdate(game);
  });
};
