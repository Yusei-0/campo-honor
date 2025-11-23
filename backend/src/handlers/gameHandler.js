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

    const isPlayer1 = socket.id === game.player1.id;
    const player = isPlayer1 ? game.player1 : game.player2;

    // Validation
    if (game.turn !== socket.id) return; // Not your turn
    if (cardIndex < 0 || cardIndex >= player.hand.length) return; // Invalid card

    const validRow = isPlayer1 ? 8 : 1;
    if (target.r !== validRow) return;
    if (game.board[target.r][target.c] !== null) return; // Occupied

    const cardId = player.hand[cardIndex];
    const cost = 3;
    if (player.energy < cost) return;

    // Execute Summon
    player.energy -= cost;
    player.hand.splice(cardIndex, 1); // Remove card

    game.board[target.r][target.c] = {
      type: "unit",
      owner: socket.id,
      id: cardId,
      hp: 100, // Placeholder stats
      maxHp: 100,
    };

    // Switch Turn (Simple turn logic for POC)
    // game.turn = isPlayer1 ? game.player2.id : game.player1.id;

    emitGameUpdate(game);
  });

  socket.on("move_unit", ({ gameId, from, to }) => {
    const game = activeGames[gameId];
    if (!game) return;

    // Validation
    if (game.turn !== socket.id) return;
    const unit = game.board[from.r][from.c];
    if (!unit || unit.owner !== socket.id) return;
    if (game.board[to.r][to.c] !== null) return; // Occupied

    // Distance Check (Manhattan <= 3 for POC)
    const dist = Math.abs(from.r - to.r) + Math.abs(from.c - to.c);
    if (dist > 3) return;

    // Execute Move
    game.board[to.r][to.c] = unit;
    game.board[from.r][from.c] = null;

    emitGameUpdate(game);
  });
};
