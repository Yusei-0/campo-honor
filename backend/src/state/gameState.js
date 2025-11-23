// Game State Management

// Matchmaking Queue
let matchmakingQueue = [];

// Pending Matches: matchId -> { player1: {id, confirmed}, player2: {id, confirmed} }
let pendingMatches = {};

// Active Games: gameId -> gameData
let activeGames = {};

module.exports = {
  matchmakingQueue,
  pendingMatches,
  activeGames,
};
