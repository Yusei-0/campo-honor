import React, { useState, useEffect } from 'react';
import './GameScreen.css';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import cardsData from '../../../card.json';

// Import PNGs directly (reusing logic from CardsScreen, ideally should be a utility)
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

const getCardData = (cardId) => {
    return cardsData.find(c => c.id === cardId);
};

const GameScreen = ({ gameData }) => {
  const socket = useSocket();
  const { playSound } = useSound();
  const [gameState, setGameState] = useState(gameData);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [selectedUnitPos, setSelectedUnitPos] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('game_update', (data) => {
      setGameState(data);
      // Reset selections on update
      setSelectedCardIndex(null);
      setSelectedUnitPos(null);
    });

    return () => {
      socket.off('game_update');
    };
  }, [socket]);

  const handleCardClick = (index) => {
    if (!gameState.turn) return; // Not your turn
    if (selectedCardIndex === index) {
        setSelectedCardIndex(null);
    } else {
        setSelectedCardIndex(index);
        setSelectedUnitPos(null);
        playSound('click');
    }
  };

  const handleBoardClick = (r, c) => {
    if (!gameState.turn) return;

    // Summon Logic
    if (selectedCardIndex !== null) {
        socket.emit('summon_unit', {
            gameId: gameState.gameId,
            cardIndex: selectedCardIndex,
            target: { r, c }
        });
        return;
    }

    // Move Logic
    const clickedCell = gameState.board[r][c];
    
    // Select Unit
    if (clickedCell && clickedCell.type === 'unit' && clickedCell.owner === socket.id) {
        setSelectedUnitPos({ r, c });
        playSound('click');
        return;
    }

    // Move Unit
    if (selectedUnitPos) {
        socket.emit('move_unit', {
            gameId: gameState.gameId,
            from: selectedUnitPos,
            to: { r, c }
        });
    }
  };

  const { hand, energy, opponent, turn, board } = gameState;

  return (
    <div className="game-screen">
      {/* Top Bar */}
      <div className="game-top-bar">
        <div className="player-info">
          <div className="avatar" style={{background: '#e74c3c'}}></div>
          <span className="player-name">{opponent}</span>
        </div>
        <div className="opponent-hand">
          {[1,2,3,4,5].map(i => <div key={i} className="card-back-mini"></div>)}
        </div>
      </div>

      {/* Game Board */}
      <div className="game-board-container">
        <div className="game-board">
          {board.map((row, r) => (
            row.map((cell, c) => {
                const isSpawnZone = (r === 8); // Hardcoded for P1 POC
                const isValidSpawn = selectedCardIndex !== null && isSpawnZone && !cell;
                // Simple move highlight (Manhattan <= 3)
                const isValidMove = selectedUnitPos && !cell && (Math.abs(selectedUnitPos.r - r) + Math.abs(selectedUnitPos.c - c) <= 3);

                return (
                    <div 
                        key={`${r}-${c}`} 
                        className={`board-cell ${isValidSpawn ? 'valid-spawn' : ''} ${isValidMove ? 'valid-move' : ''}`}
                        onClick={() => handleBoardClick(r, c)}
                    >
                        {cell && cell.type === 'tower' && (
                            <div style={{fontSize: '2rem'}}>
                                {cell.owner === socket.id ? '🏰' : '🏯'}
                            </div>
                        )}
                        {cell && cell.type === 'unit' && (
                            <div style={{
                                width: '80%', height: '80%', 
                                background: cell.owner === socket.id ? '#3498db' : '#e74c3c',
                                borderRadius: '50%',
                                border: '2px solid white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <img src={getImageForCard(cell.id)} alt="unit" style={{width: '70%', height: '70%', objectFit: 'contain'}} />
                            </div>
                        )}
                    </div>
                );
            })
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="game-bottom-bar">
        <div className="player-stats">
          <span>⚡ Energía: {energy}/10</span>
          <span>{turn ? "🟢 Tu Turno" : "🔴 Turno del Oponente"}</span>
        </div>
        
        <div className="player-hand">
          {hand.map((cardId, index) => {
            const card = getCardData(cardId);
            return (
              <div 
                key={index} 
                className={`hand-card ${selectedCardIndex === index ? 'selected' : ''}`}
                onClick={() => handleCardClick(index)}
              >
                <div className="hand-card-cost">{card ? 3 : '?'}</div>
                <img src={getImageForCard(cardId)} alt={card ? card.name : 'Card'} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
