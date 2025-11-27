import React from 'react';
import { getImageForCard } from './GameBoard';

const GameSidePanel = ({ 
  selectedCardData, 
  selectedUnitPos, 
  board, 
  gameState, 
  socketId, 
  energy,
  handleAbilityClick, 
  getAbilityDescription 
}) => {
  return (
    <div className="game-side-panel">
      <h3 className="panel-title">Detalles</h3>
      {selectedCardData ? (
          <div className="card-details">
              <div className="detail-image-container">
                  <img src={getImageForCard(selectedCardData.id)} alt={selectedCardData.name} />
              </div>
              <h4>{selectedCardData.name}</h4>
              <p className="detail-desc">{selectedCardData.description}</p>
              
              {/* Ability Section */}
              {selectedUnitPos && board[selectedUnitPos.r][selectedUnitPos.c]?.abilities && (
                <div className="ability-list">
                  <div className="ability-buttons-title">✨ Habilidades</div>
                  {board[selectedUnitPos.r][selectedUnitPos.c].abilities.map((ability, index) => (
                    <div key={index} className="ability-item">
                      <div className="ability-item-header">
                        <span className="ability-item-name">{ability.name}</span>
                        <span className="ability-item-type">
                          {ability.abilityType === 'active' ? `⚡${ability.energyCost}` : '🔄 Pasiva'}
                        </span>
                      </div>
                      <div className="ability-item-desc">
                        {getAbilityDescription(ability)}
                      </div>
                      {/* Only show button if it's MY unit and it's active */}
                      {ability.abilityType === 'active' && gameState.turn && selectedUnitPos && board[selectedUnitPos.r][selectedUnitPos.c]?.owner === socketId && (
                        <button 
                          className="ability-btn"
                          onClick={() => handleAbilityClick(index)}
                          disabled={!gameState.turn || board[selectedUnitPos.r][selectedUnitPos.c].abilityUsedThisTurn || energy < (ability.energyCost || 0)}
                        >
                          <span className="ability-btn-name">Usar {ability.name}</span>
                          <span className="ability-btn-cost">⚡ {ability.energyCost}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Stats Section */}
              <div className="detail-stats">
                  <div className="stat-row"><span>⚔️ Ataque:</span> <span>{selectedCardData.attack}</span></div>
                  <div className="stat-row"><span>🛡️ Defensa:</span> <span>{selectedCardData.defense}</span></div>
                  <div className="stat-row"><span>❤️ Vida:</span> <span>{selectedUnitPos ? `${board[selectedUnitPos.r][selectedUnitPos.c].hp}/${selectedCardData.maxHp}` : selectedCardData.maxHp}</span></div>
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
  );
};

export default GameSidePanel;
