const { BOARD_HEIGHT, BOARD_WIDTH, TOWER_HP } = require("../constants/game");

// Heuristic weights
const WEIGHTS = {
  KILL_UNIT: 100,
  DAMAGE_TOWER: 50,
  SUMMON_UNIT: 20,
  MOVE_FORWARD: 5,
  ATTACK_UNIT: 10,
  SAVE_ENERGY: 1,
};

const computeBestMove = (game, aiPlayerId) => {
  const { board, player1, player2 } = game;
  const aiPlayer = aiPlayerId === player1.id ? player1 : player2;
  const opponent = aiPlayerId === player1.id ? player2 : player1;

  // 1. Check for lethal on Tower
  // ... (Simplified for now)

  // 2. Check for possible attacks
  const attacks = getPossibleAttacks(game, aiPlayerId);
  if (attacks.length > 0) {
    // Prioritize kills
    const kills = attacks.filter((a) => a.isKill);
    if (kills.length > 0) return kills[0];

    // Then tower damage
    const towerHits = attacks.filter((a) => a.targetType === "tower");
    if (towerHits.length > 0) return towerHits[0];

    // Then normal attacks
    return attacks[0];
  }

  // 3. Summon Units (if energy allows)
  // Simple logic: Summon cheapest unit if board is empty or random
  if (aiPlayer.energy >= 2) {
    // Min cost
    const summon = getBestSummon(game, aiPlayerId);
    if (summon) return summon;
  }

  // 4. Move Units
  const moves = getPossibleMoves(game, aiPlayerId);
  if (moves.length > 0) {
    // Prioritize moving towards enemy tower
    return moves[0];
  }

  // 5. End Turn
  return { type: "end_turn" };
};

const getPossibleAttacks = (game, aiPlayerId) => {
  const attacks = [];
  const { board } = game;

  for (let r = 0; r < BOARD_HEIGHT; r++) {
    for (let c = 0; c < BOARD_WIDTH; c++) {
      const unit = board[r][c];
      if (unit && unit.owner === aiPlayerId && !unit.hasAttacked) {
        // Check range
        for (let tr = 0; tr < BOARD_HEIGHT; tr++) {
          for (let tc = 0; tc < BOARD_WIDTH; tc++) {
            const target = board[tr][tc];
            if (target && target.owner !== aiPlayerId) {
              const dist = Math.abs(r - tr) + Math.abs(c - tc);
              if (dist <= unit.range) {
                const damage = Math.max(0, unit.attack - (target.defense || 0));
                attacks.push({
                  type: "attack",
                  from: { r, c },
                  to: { r: tr, c: tc },
                  damage,
                  isKill: target.hp <= damage,
                  targetType: target.type,
                });
              }
            }
          }
        }
      }
    }
  }
  // Sort by value (Kill > Tower > Damage)
  return attacks.sort((a, b) => {
    if (a.isKill && !b.isKill) return -1;
    if (!a.isKill && b.isKill) return 1;
    if (a.targetType === "tower" && b.targetType !== "tower") return -1;
    if (a.targetType !== "tower" && b.targetType === "tower") return 1;
    return b.damage - a.damage;
  });
};

const getPossibleMoves = (game, aiPlayerId) => {
  const moves = [];
  const { board } = game;
  // AI is usually Player 2 (Top), moving down (increasing R)
  // Or Player 1 (Bottom), moving up (decreasing R)
  const direction = aiPlayerId === game.player2.id ? 1 : -1;

  for (let r = 0; r < BOARD_HEIGHT; r++) {
    for (let c = 0; c < BOARD_WIDTH; c++) {
      const unit = board[r][c];
      if (unit && unit.owner === aiPlayerId && !unit.hasMoved) {
        // Try moving forward
        const newR = r + direction;
        if (newR >= 0 && newR < BOARD_HEIGHT && !board[newR][c]) {
          moves.push({
            type: "move",
            from: { r, c },
            to: { r: newR, c },
          });
        }
        // Try diagonals or side if blocked? Keep simple for now.
      }
    }
  }
  return moves;
};

const getBestSummon = (game, aiPlayerId) => {
  const { player1, player2, board } = game;
  const aiPlayer = aiPlayerId === player1.id ? player1 : player2;
  const spawnRow = aiPlayerId === player1.id ? 6 : 1; // Assuming P1 bottom, P2 top spawn zones

  // Find playable cards
  const playableCards = aiPlayer.hand
    .map((cardId, index) => ({
      id: cardId,
      index,
      data: game.cardsData.find((c) => c.id === cardId),
    }))
    .filter((c) => c.data && c.data.cost <= aiPlayer.energy);

  if (playableCards.length === 0) return null;

  // Pick strongest available (highest cost)
  playableCards.sort((a, b) => b.data.cost - a.data.cost);
  const bestCard = playableCards[0];

  // Find empty spawn slot
  const emptySlots = [];
  for (let c = 0; c < BOARD_WIDTH; c++) {
    if (!board[spawnRow][c]) emptySlots.push({ r: spawnRow, c });
  }

  if (emptySlots.length > 0) {
    // Pick random slot or center
    const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    return {
      type: "summon",
      cardIndex: bestCard.index,
      target: slot,
    };
  }
  return null;
};

module.exports = { computeBestMove };
