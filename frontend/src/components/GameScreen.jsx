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

const GameScreen = ({ gameData }) => {
  const socket = useSocket();
  const { playSound } = useSound();
  const [gameState, setGameState] = useState(gameData);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [selectedUnitPos, setSelectedUnitPos] = useState(null);
  const [mode, setMode] = useState('summon');

  useEffect(() => {
    if (!socket) return;
    socket.on('game_update', (data) => {
      setGameState(data);
      setSelectedCardIndex(null);
      setSelectedUnitPos(null);
    });
    socket.on('game_over', (data) => {
      alert(`Juego Terminado: ${data.result === 'victory' ? 'Victoria!' : 'Derrota'}\n${data.reason}`);
    });
    return () => {
      socket.off('game_update');
      socket.off('game_over');
    };
  }, [socket]);

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
      playSound('click');
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
      playSound('click');
      return;
    }
    if (mode === 'attack' && selectedUnitPos && clickedCell && clickedCell.owner !== socket.id) {
      socket.emit('attack_unit', { gameId: gameState.gameId, from: selectedUnitPos, to: { r, c } });
      playSound('click');
      return;
    }
  };

  const handleEndTurn = () => {
    if (!gameState.turn) return;
    socket.emit('end_turn', { gameId: gameState.gameId });
    playSound('click');
  };

  const { hand, energy, opponent, turn, board } = gameState;

  const getValidCells = () => {
    const valid = {};
    if (mode === 'summon' && selectedCardIndex !== null) {
      const spawnRow = 6;
      for (let c = 0; c < board[0].length; c++) {
        if (!board[spawnRow][c]) valid[`${spawnRow}-${c}`] = 'spawn';
      }
    }
    if (mode === 'move' && selectedUnitPos) {
      const unit = board[selectedUnitPos.r][selectedUnitPos.c];
      if (unit && !unit.hasMoved) {
        for (let r = 0; r < board.length; r++) {
          for (let c = 0; c < board[r].length; c++) {
            const dist = Math.abs(selectedUnitPos.r - r) + Math.abs(selectedUnitPos.c - c);
            if (dist <= unit.speed && dist > 0 && !board[r][c]) valid[`${r}-${c}`] = 'move';
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
            if (dist <= unit.range && dist > 0 && target && target.owner !== socket.id) valid[`${r}-${c}`] = 'attack';
          }
        }
      }
    }
    return valid;
  };

  const validCells = getValidCells();

  return (
    <div className="game-screen">
      <div className="game-top-bar">
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
          {board && board.map((row, r) => row.map((cell, c) => {
            const cellKey = `${r}-${c}`;
            const isValid = validCells[cellKey];
            const isSelected = selectedUnitPos && selectedUnitPos.r === r && selectedUnitPos.c === c;
            return (
              <div 
                key={cellKey} 
                className={`board-cell ${isValid === 'spawn' ? 'valid-spawn' : ''} ${isValid === 'move' ? 'valid-move' : ''} ${isValid === 'attack' ? 'in-attack-range' : ''}`}
                onClick={() => handleBoardClick(r, c)}
              >
                {cell && cell.type === 'tower' && (
                  <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                    <img src={cell.owner === socket.id ? towerGoodImg : towerBadImg} alt="tower" style={{width: '60%', height: '60%', objectFit: 'contain'}} />
                    <div className="tower-hp">{cell.hp}/{cell.maxHp}</div>
                  </div>
                )}
                {cell && cell.type === 'unit' && (
                  <div className={`unit-container ${isSelected ? 'selected-attacker' : ''}`} style={{width: '80%', height: '80%', background: cell.owner === socket.id ? '#3498db' : '#e74c3c', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                    <img src={getImageForCard(cell.id)} alt="unit" style={{width: '70%', height: '70%', objectFit: 'contain'}} />
                    <div className="unit-hp-bar"><div className="unit-hp-fill" style={{width: `${(cell.hp / cell.maxHp) * 100}%`}}></div></div>
                    <div className="unit-status">
                      {cell.hasMoved && <div className="status-icon status-moved">M</div>}
                      {cell.hasAttacked && <div className="status-icon status-attacked">A</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      </div>

      <div className="game-bottom-bar">
        <div className="player-stats">
          <span>Energia: {energy}/10</span>
          <span>{turn ? "Tu Turno" : "Turno Oponente"}</span>
          {selectedUnitPos && (
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button onClick={() => setMode('move')} style={{background: mode === 'move' ? '#3498db' : '#555', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'white', cursor: 'pointer'}}>Mover</button>
              <button onClick={() => setMode('attack')} style={{background: mode === 'attack' ? '#e74c3c' : '#555', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'white', cursor: 'pointer'}}>Atacar</button>
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
  );
};

export default GameScreen;
