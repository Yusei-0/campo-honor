// Game Constants
const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 8;
const TOWER_HP = 50;

// Tower Positions (row, col)
const TOWER_POSITIONS = {
  player1: { r: 7, c: 3 }, // Bottom center
  player2: { r: 0, c: 3 }, // Top center
};

// Spawn Zones (rows)
const SPAWN_ZONES = {
  player1: 6, // Row 6
  player2: 1, // Row 1
};

module.exports = {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TOWER_HP,
  TOWER_POSITIONS,
  SPAWN_ZONES,
};
