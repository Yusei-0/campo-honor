import React from 'react';
import { getImageForCard } from './GameBoard';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <div className="game-side-panel">
      <h3 className="panel-title">{t('sidePanel.cardDetails')}</h3>
      {selectedCardData ? (
          <div className="card-details">
              <div className="detail-image-container">
                  <img src={getImageForCard(selectedCardData.id)} alt={selectedCardData.name} />
              </div>
              <h4>{t(`cards:${selectedCardData.id}.name`)}</h4>
              <p className="detail-desc">{t(`cards:${selectedCardData.id}.description`)}</p>
              
              {/* Ability Section */}
              {selectedUnitPos && board[selectedUnitPos.r][selectedUnitPos.c]?.abilities && (
                <div className="ability-list">
                  <div className="ability-buttons-title">✨ {t('sidePanel.abilities')}</div>
                  {board[selectedUnitPos.r][selectedUnitPos.c].abilities.map((ability, index) => (
                    <div key={index} className="ability-item">
                      <div className="ability-item-header">
                        <span className="ability-item-name">{ability.name}</span>
                        <span className="ability-item-type">
                          {ability.abilityType === 'active' ? `⚡${ability.energyCost}` : `🔄 ${t('sidePanel.passive')}`}
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
                          <span className="ability-btn-name">{t('sidePanel.active')} {ability.name}</span>
                          <span className="ability-btn-cost">⚡ {ability.energyCost}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Stats Section */}
              <div className="detail-stats">
                  <div className="stat-row"><span>⚔️ {t('sidePanel.stats.attack')}:</span> <span>{selectedCardData.attack}</span></div>
                  <div className="stat-row"><span>🛡️ {t('sidePanel.stats.defense')}:</span> <span>{selectedCardData.defense}</span></div>
                  <div className="stat-row"><span>❤️ {t('sidePanel.stats.hp')}:</span> <span>{selectedUnitPos ? `${board[selectedUnitPos.r][selectedUnitPos.c].hp}/${selectedCardData.maxHp}` : selectedCardData.maxHp}</span></div>
                  <div className="stat-row"><span>🎯 {t('sidePanel.stats.range')}:</span> <span>{selectedCardData.range}</span></div>
                  <div className="stat-row"><span>👟 {t('sidePanel.stats.speed')}:</span> <span>{selectedCardData.speed}</span></div>
                  <div className="stat-row"><span>⚡ {t('sidePanel.cost')}:</span> <span>{selectedCardData.cost}</span></div>
              </div>
          </div>
      ) : (
          <div className="empty-details">
              <p>{t('sidePanel.selectCard')}</p>
          </div>
      )}
    </div>
  );
};

export default GameSidePanel;
