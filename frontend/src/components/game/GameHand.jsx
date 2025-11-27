import React from 'react';
import { getImageForCard } from './GameBoard';

const GameHand = ({ 
  hand, 
  selectedCardIndex, 
  handleCardClick, 
  getCardData 
}) => {
  return (
    <div className="player-hand">
      {hand && hand.map((cardId, index) => {
        const card = getCardData(cardId);
        return (
          <div 
            key={index} 
            className={`hand-card ${selectedCardIndex === index ? 'selected' : ''}`} 
            onClick={() => handleCardClick(index)}
          >
            <div className="hand-card-cost">{card ? card.cost : '?'}</div>
            <img src={getImageForCard(cardId)} alt={card ? card.name : 'Card'} />
          </div>
        );
      })}
    </div>
  );
};

export default GameHand;
