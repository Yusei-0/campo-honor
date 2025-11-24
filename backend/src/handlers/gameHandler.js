const { activeGames } = require("../state/gameState");
const { computeBestMove } = require("../ai/aiEngine");
const { SPAWN_ZONES } = require("../constants/game");

module.exports = (io, socket) => {
  const emitGameUpdate = (game) => {
    const commonData = {
      gameId: game.id,
      board: game.board,
      player1Id: game.player1.id,
      player2Id: game.player2.id,
    };

    // If player 2 is AI, we don't need to emit to its socket (it's a mock)
    // But we must emit to Player 1
    if (game.player1.socket && game.player1.socket.emit) {
      io.to(game.player1.socket.id).emit("game_update", {
        ...commonData,
        hand: game.player1.hand,
        energy: game.player1.energy,
        turn: game.turn === game.player1.id,
        opponent: game.player2.name,
      });
    }

    if (game.player2.socket && game.player2.socket.emit) {
      io.to(game.player2.socket.id).emit("game_update", {
        ...commonData,
        hand: game.player2.hand,
        energy: game.player2.energy,
        turn: game.turn === game.player2.id,
        opponent: game.player1.name,
      });
    }
  };

  const executeAIMove = (game) => {
    if (!game.active) return; // Safety check

    const move = computeBestMove(game, game.turn);
    console.log("[AI] Decided move:", move.type);

    if (move.type === "end_turn") {
      console.log("[AI] Ending turn");
      switchTurn(game);
      emitGameUpdate(game);
      return;
    }

    if (move.type === "summon") {
      const player = game.player2; // AI is always P2 for now
      const { cardIndex, target } = move;
      const cardId = player.hand[cardIndex];
      const cardData = game.cardsData.find((c) => c.id === cardId);

      player.energy -= cardData.cost;
      player.hand.splice(cardIndex, 1);

      game.board[target.r][target.c] = {
        type: "unit",
        owner: player.id,
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

      console.log("[AI] Summoned unit");
      switchTurn(game);
      emitGameUpdate(game);
      return;
    }

    if (move.type === "move") {
      const { from, to } = move;
      const unit = game.board[from.r][from.c];
      unit.hasMoved = true;
      game.board[to.r][to.c] = unit;
      game.board[from.r][from.c] = null;

      console.log("[AI] Moved unit");
      emitGameUpdate(game);
      // Move doesn't end turn, so AI thinks again after delay
      setTimeout(() => executeAIMove(game), 1000);
      return;
    }

    if (move.type === "attack") {
      const { from, to } = move;
      const attacker = game.board[from.r][from.c];
      const target = game.board[to.r][to.c];

      const damage = Math.max(1, attacker.attack - (target.defense || 0));
      target.hp -= damage;
      attacker.hasAttacked = true;

      const attackResult = {
        attackerId: attacker.id,
        targetId: target.type === "unit" ? target.id : "tower",
        damage: damage,
        isKill: target.hp <= 0,
        from: from,
        to: to,
        attackerOwner: attacker.owner,
        targetOwner: target.owner,
      };

      // Emit cinematic
      io.to(game.player1.socket.id).emit("attack_result", attackResult);

      if (target.hp <= 0) {
        game.board[to.r][to.c] = null;
        if (target.type === "tower") {
          // AI Wins
          io.to(game.player1.socket.id).emit("game_over", {
            result: "defeat",
            reason: "Tu torre fue destruida",
          });
          game.active = false; // Mark game as ended
          delete activeGames[game.id];
          return;
        }
      }

      console.log("[AI] Attacked");
      switchTurn(game);
      emitGameUpdate(game);
      return;
    }
  };

  const switchTurn = (game) => {
    if (game.active === false) return; // Game over check

    console.log("[TURN SWITCH] Before:", game.turn);

    // Reset unit states for the player whose turn is ending
    for (let r = 0; r < game.board.length; r++) {
      for (let c = 0; c < game.board[r].length; c++) {
        const cell = game.board[r][c];
        if (cell && cell.type === "unit" && cell.owner === game.turn) {
          cell.hasMoved = false;
          cell.hasAttacked = false;
        }
      }
    }

    // Switch turn
    game.turn =
      game.turn === game.player1.id ? game.player2.id : game.player1.id;

    // Energy Regen
    const activePlayer =
      game.turn === game.player1.id ? game.player1 : game.player2;
    if (activePlayer.energy < 10) activePlayer.energy += 1;

    console.log("[TURN SWITCH] After:", game.turn);

    // Check if AI Turn
    if (game.isSolo && game.turn === game.player2.id) {
      console.log("[AI] It is AI turn, thinking...");
      setTimeout(() => executeAIMove(game), 1500);
    }
  };

  socket.on("summon_unit", ({ gameId, cardIndex, target }) => {
    const game = activeGames[gameId];
    if (!game) return;
    game.active = true; // Ensure game is marked active

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

    // BFS Pathfinding to check for obstacles
    const queue = [{ r: from.r, c: from.c, dist: 0 }];
    const visited = new Set([`${from.r}-${from.c}`]);
    let pathFound = false;

    while (queue.length > 0) {
      const { r, c, dist } = queue.shift();

      if (r === to.r && c === to.c) {
        pathFound = true;
        break;
      }

      if (dist >= unit.speed) continue;

      const directions = [
        { r: -1, c: 0 },
        { r: 1, c: 0 },
        { r: 0, c: -1 },
        { r: 0, c: 1 },
      ];

      for (const dir of directions) {
        const newR = r + dir.r;
        const newC = c + dir.c;
        const key = `${newR}-${newC}`;

        if (
          newR >= 0 &&
          newR < game.board.length &&
          newC >= 0 &&
          newC < game.board[0].length &&
          !visited.has(key)
        ) {
          // Check if cell is blocked (unless it's the destination)
          const isDestination = newR === to.r && newC === to.c;
          const cellContent = game.board[newR][newC];

          if (!cellContent || isDestination) {
            visited.add(key);
            queue.push({ r: newR, c: newC, dist: dist + 1 });
          }
        }
      }
    }

    if (!pathFound) return;

    unit.hasMoved = true;
    game.board[to.r][to.c] = unit;
    game.board[from.r][from.c] = null;

    if (unit.isRanged) {
      console.log("[MOVE] Ranged unit moved, turn ends");
      switchTurn(game);
    } else {
      // Melee unit - Check for targets
      let hasTargets = false;
      const range = unit.range;

      for (let r = 0; r < game.board.length; r++) {
        for (let c = 0; c < game.board[r].length; c++) {
          const target = game.board[r][c];
          if (target && target.owner !== socket.id) {
            const dist = Math.abs(to.r - r) + Math.abs(to.c - c);
            if (dist <= range) {
              hasTargets = true;
              break;
            }
          }
        }
        if (hasTargets) break;
      }

      if (hasTargets) {
        console.log("[MOVE] Melee unit moved, targets found, prompting");
        socket.emit("action_prompt", {
          message: "Enemigo en rango. ¿Deseas atacar?",
          options: ["Atacar", "Terminar Turno"],
        });
      } else {
        console.log("[MOVE] Melee unit moved, no targets, turn ends");
        switchTurn(game);
      }
    }

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

        // If loser is real player, emit defeat
        if (game.player2.socket && game.player2.socket.emit) {
          io.to(loser).emit("game_over", {
            result: "defeat",
            reason: "Tu torre fue destruida",
          });
        }

        game.active = false;
        delete activeGames[gameId];
        return;
      }
    }

    console.log("[ATTACK] Attack completed, switching turn");

    // Emit cinematic event to both players
    const attackResult = {
      attackerId: attacker.id,
      targetId: target.type === "unit" ? target.id : "tower",
      damage: damage,
      isKill: target.hp <= 0,
      from: from,
      to: to,
      attackerOwner: attacker.owner,
      targetOwner: target.owner,
    };

    io.to(game.player1.socket.id).emit("attack_result", attackResult);
    if (game.player2.socket && game.player2.socket.emit) {
      io.to(game.player2.socket.id).emit("attack_result", attackResult);
    }

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
