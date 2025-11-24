import React, { useState, useEffect } from 'react';
import './GameScreen.css';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import cardsData from '../../../card.json';
import towerGoodImg from '../../board/board_tower.png';
import towerBadImg from '../../board/board_tower_bad.png';
import knightPng from '../../cards/card_knight.png';
import archerPng from '../../cards/card_archer.png';
import magePng from '../../cards/card_mage.png';
import shieldPng from '../../cards/card_shield.png';
import lancerPng from '../../cards/card_lancer.png';
import catapultPng from '../../cards/card_catapult.png';
import healerPng from '../../cards/card_healer.png';

const getImageForCard = (cardId) => {
  if (!cardId) return knightPng;
  if (cardId.includes('knight')) return knightPng;
  if (cardId.includes('archer')) return archerPng;
  if (cardId.includes('mage')) return magePng;
  if (cardId.includes('shield')) return shieldPng;
  if (cardId.includes('lancer')) return lancerPng;
  if (cardId.includes('catapult')) return catapultPng;
  if (cardId.includes('healer')) return healerPng;
  return knightPng;
};

const getCardData = (cardId) => cardsData.find(c => c.id === cardId);

const getHPClass = (hp, maxHp) => {
  const percentage = (hp / maxHp) * 100;
  if (percentage > 50) return 'high';
  if (percentage > 25) return 'medium';
  return 'low';
};

const GameScreen = ({ gameData }) => {
  const socket = useSocket();
  const { playSound } = useSound();
  const [gameState, setGameState] = useState(gameData);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [selectedUnitPos, setSelectedUnitPos] = useState(null);
  const [mode, setMode] = useState('summon');
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [turnBannerText, setTurnBannerText] = useState('');
  const [animatingCells, setAnimatingCells] = useState({});

  useEffect(() => {
    if (!socket) return;
    socket.on('game_update', (data) => {
      const wasTurn = gameState.turn;
      const isTurn = data.turn;
      
      // Show turn banner when turn changes
      if (wasTurn !== isTurn) {
        setTurnBannerText(isTurn ? '¡TU TURNO!' : 'TURNO DEL OPONENTE');
        setShowTurnBanner(true);
        setTimeout(() => setShowTurnBanner(false), 2000);
      }
      
      setGameState(data);
      setSelectedCardIndex(null);
      setSelectedUnitPos(null);
      setMode('summon');
    });
    socket.on('game_over', (data) => {
      alert(`Juego Terminado: ${data.result === 'victory' ? '¡VICTORIA!' : 'DERROTA'}\n${data.reason}`);
    });
    return () => {
      socket.off('game_update');
      socket.off('game_over');
    };
  }, [socket, gameState.turn]);

  const handleCardClick = (index) => {
    if (!gameState.turn) return;
    if (selectedCardIndex === index) {
      setSelectedCardIndex(null);
      setMode('summon');
    } else {
      setSelectedCardIndex(index);
      setSelectedUnitPos(null);
      setMode('summon');
      playSound('click');
    }
  };

  const handleBoardClick = (r, c) => {
    if (!gameState.turn) return;
    const clickedCell = gameState.board[r][c];
    
    if (mode === 'summon' && selectedCardIndex !== null) {
      socket.emit('summon_unit', { gameId: gameState.gameId, cardIndex: selectedCardIndex, target: { r, c } });
      setAnimatingCells({[`${r}-${c}`]: 'spawn'});
      playSound('click');
      setTimeout(() => setAnimatingCells({}), 500);
      return;
    }
    
    if (clickedCell && clickedCell.type === 'unit' && clickedCell.owner === socket.id) {
      setSelectedUnitPos({ r, c });
      setSelectedCardIndex(null);
      setMode('move');
      playSound('click');
      return;
    }
    
    if (mode === 'move' && selectedUnitPos) {
      socket.emit('move_unit', { gameId: gameState.gameId, from: selectedUnitPos, to: { r, c } });
      setAnimatingCells({[`${r}-${c}`]: 'move'});
      playSound('click');
      setTimeout(() => setAnimatingCells({}), 400);
      return;
    }
    
    if (mode === 'attack' && selectedUnitPos && clickedCell && clickedCell.owner !== socket.id) {
      socket.emit('attack_unit', { gameId: gameState.gameId, from: selectedUnitPos, to: { r, c } });
      setAnimatingCells({[`${selectedUnitPos.r}-${selectedUnitPos.c}`]: 'attack', [`${r}-${c}`]: 'damage'});
      playSound('click');
      setTimeout(() => setAnimatingCells({}), 600);
      return;
    }
  };

  const { hand, energy, opponent, turn, board, player1, player2 } = gameState;
  const isFlipped = socket.id === gameState.player2?.id;

  // Transform logical coordinates to visual coordinates and vice versa
  const toVisual = (r, c) => isFlipped ? { r: 7 - r, c: 6 - c } : { r, c };
  const toLogical = (r, c) => isFlipped ? { r: 7 - r, c: 6 - c } : { r, c };

  const getValidCells = () => {
    const valid = {};
    if (mode === 'summon' && selectedCardIndex !== null) {
      const spawnRow = isFlipped ? 1 : 6; // Visual spawn row (Logical 6 for P1, Logical 1 for P2... wait. P2 spawns at logical 1? Let's check constants)
      // Actually, let's just check logical validity and map to visual
      const logicalSpawnRow = isFlipped ? 1 : 6; // Assuming P2 spawns at top (logical 1) and P1 at bottom (logical 6)
      // Wait, let's check constants/game.js if possible, or assume standard.
      // Standard: P1 row 6, P2 row 1.
      // If isFlipped (P2), logical row 1 is visual row 7-1 = 6. So visually it's always row 6.
      
      const startR = isFlipped ? 1 : 6;
      for (let c = 0; c < board[0].length; c++) {
        if (!board[startR][c]) {
            const visual = toVisual(startR, c);
            valid[`${visual.r}-${visual.c}`] = 'spawn';
        }
      }
    }
    
    if (mode === 'move' && selectedUnitPos) {
      const unit = board[selectedUnitPos.r][selectedUnitPos.c];
      if (unit && !unit.hasMoved) {
        for (let r = 0; r < board.length; r++) {
          for (let c = 0; c < board[r].length; c++) {
            const dist = Math.abs(selectedUnitPos.r - r) + Math.abs(selectedUnitPos.c - c);
            if (dist <= unit.speed && dist > 0 && !board[r][c]) {
                const visual = toVisual(r, c);
                valid[`${visual.r}-${visual.c}`] = 'move';
            }
          }
        }
      }
    }

    if (mode === 'attack' && selectedUnitPos) {
      const unit = board[selectedUnitPos.r][selectedUnitPos.c];
      if (unit && !unit.hasAttacked) {
        for (let r = 0; r < board.length; r++) {
          for (let c = 0; c < board[r].length; c++) {
            const dist = Math.abs(selectedUnitPos.r - r) + Math.abs(selectedUnitPos.c - c);
            const target = board[r][c];
            if (dist <= unit.range && dist > 0 && target && target.owner !== socket.id) {
                const visual = toVisual(r, c);
                valid[`${visual.r}-${visual.c}`] = 'attack';
            }
          }
        }
      }
    }
    return valid;
  };

  const validCells = getValidCells();
  const selectedCardData = selectedCardIndex !== null ? getCardData(hand[selectedCardIndex]) : 
                          (selectedUnitPos ? getCardData(board[selectedUnitPos.r][selectedUnitPos.c]?.id) : null);

  const handleEndTurn = () => {
    if (!gameState.turn) return;
    socket.emit('end_turn', { gameId: gameState.gameId });
    playSound('click');
  };

  // Helper to get cell content for rendering
  const renderCell = (visualR, visualC) => {
      const { r, c } = toLogical(visualR, visualC);
      const cell = board[r][c];
      const cellKey = `${visualR}-${visualC}`; // Use visual coordinates for keys/selection
      const isValid = validCells[cellKey];
      
      // Check if this cell is the selected unit (need to compare logical coords)
      const isSelected = selectedUnitPos && selectedUnitPos.r === r && selectedUnitPos.c === c;
      const animClass = animatingCells[`${r}-${c}`]; // Animation keys use logical coords

      return (
        <div 
          key={cellKey} 
          className={`board-cell ${isValid === 'spawn' ? 'valid-spawn' : ''} ${isValid === 'move' ? 'valid-move' : ''} ${isValid === 'attack' ? 'in-attack-range' : ''}`}
          onClick={() => handleBoardClickVisual(visualR, visualC)} // Pass visual coords, handler will convert
        >
          {cell && cell.type === 'tower' && (
            <div className={`tower-container ${animClass === 'damage' ? 'taking-damage' : ''}`} style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
              <img src={cell.owner === socket.id ? towerGoodImg : towerBadImg} alt="tower" style={{width: '70%', height: '70%', objectFit: 'contain'}} />
              <div className="tower-hp">{cell.hp}/{cell.maxHp}</div>
            </div>
          )}
          {cell && cell.type === 'unit' && (
            <div className={`unit-container ${isSelected ? 'selected-attacker' : ''} ${animClass === 'spawn' ? 'just-spawned' : ''} ${animClass === 'move' ? 'moving' : ''} ${animClass === 'attack' ? 'attacking' : ''} ${animClass === 'damage' ? 'taking-damage' : ''}`} style={{width: '80%', height: '80%', background: cell.owner === socket.id ? '#3498db' : '#e74c3c', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
              <img src={getImageForCard(cell.id)} alt="unit" style={{width: '70%', height: '70%', objectFit: 'contain'}} />
              <div className="unit-hp-bar">
                <div className={`unit-hp-fill ${getHPClass(cell.hp, cell.maxHp)}`} style={{width: `${(cell.hp / cell.maxHp) * 100}%`}}></div>
              </div>
              <div className="unit-status">
                {cell.hasMoved && <div className="status-icon status-moved">M</div>}
                {cell.hasAttacked && <div className="status-icon status-attacked">A</div>}
              </div>
            </div>
          )}
        </div>
      );
  };

  // Update handleBoardClick to accept visual coords and convert
  const handleBoardClickVisual = (visualR, visualC) => {
      const { r, c } = toLogical(visualR, visualC);
      handleBoardClick(r, c);
  };

  return (
    <div className="game-screen-layout">
      <div className="game-main-area">
        {showTurnBanner && <div className="turn-banner">{turnBannerText}</div>}
        
        <div className={`game-top-bar ${!turn ? 'your-turn' : ''}`}>
            <div className="player-info">
            <div className="avatar" style={{background: '#e74c3c'}}></div>
            <span className="player-name">{opponent}</span>
            </div>
            <div className="opponent-hand">
            {hand && hand.map((_, i) => <div key={i} className="card-back-mini"></div>)}
            </div>
        </div>

        <div className="game-board-container">
            <div className="game-board">
            {/* Render 8 rows x 7 cols */}
            {Array(8).fill(0).map((_, r) => 
                Array(7).fill(0).map((_, c) => renderCell(r, c))
            )}
            </div>
        </div>

        <div className={`game-bottom-bar ${turn ? 'your-turn' : ''}`}>
            <div className="player-stats">
            <span>⚡ Energía: {energy}/10</span>
            <span>{turn ? "🟢 TU TURNO" : "🔴 Turno Oponente"}</span>
            {selectedUnitPos && (
                <div style={{display: 'flex', gap: '0.5rem'}}>
                <button onClick={() => setMode('move')} style={{background: mode === 'move' ? '#3498db' : '#555', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold'}}>Mover</button>
                <button onClick={() => setMode('attack')} style={{background: mode === 'attack' ? '#e74c3c' : '#555', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold'}}>Atacar</button>
                </div>
            )}
            </div>
            <div className="player-hand">
            {hand && hand.map((cardId, index) => {
                const card = getCardData(cardId);
                return (
                <div key={index} className={`hand-card ${selectedCardIndex === index ? 'selected' : ''}`} onClick={() => handleCardClick(index)}>
                    <div className="hand-card-cost">{card ? card.cost : '?'}</div>
                    <img src={getImageForCard(cardId)} alt={card ? card.name : 'Card'} />
                </div>
                );
            })}
            </div>
        </div>
        
        <button className="end-turn-btn" onClick={handleEndTurn} disabled={!turn}>Terminar Turno</button>
      </div>

      {/* Side Panel */}
      <div className="game-side-panel">
        <h3 className="panel-title">Detalles</h3>
        {selectedCardData ? (
            <div className="card-details">
                <div className="detail-image-container">
                    <img src={getImageForCard(selectedCardData.id)} alt={selectedCardData.name} />
                </div>
                <h4>{selectedCardData.name}</h4>
                <p className="detail-desc">{selectedCardData.description}</p>
                <div className="detail-stats">
                    <div className="stat-row"><span>⚔️ Ataque:</span> <span>{selectedCardData.attack}</span></div>
                    <div className="stat-row"><span>🛡️ Defensa:</span> <span>{selectedCardData.defense}</span></div>
                    <div className="stat-row"><span>❤️ Vida:</span> <span>{selectedCardData.maxHp}</span></div>
                    <div className="stat-row"><span>🎯 Rango:</span> <span>{selectedCardData.range}</span></div>
                    <div className="stat-row"><span>👟 Velocidad:</span> <span>{selectedCardData.speed}</span></div>
                    <div className="stat-row"><span>⚡ Costo:</span> <span>{selectedCardData.cost}</span></div>
                </div>
            </div>
        ) : (
            <div className="empty-details">
                <p>Selecciona una carta o unidad para ver sus detalles</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default GameScreen;
