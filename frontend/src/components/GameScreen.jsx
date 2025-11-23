import React from 'react';
import './GameScreen.css';
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
  const { hand, energy, opponent, turn } = gameData;

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
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="board-cell"></div>
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
              <div key={index} className="hand-card">
                <div className="hand-card-cost">{card ? card.cost : '?'}</div>
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
