import React from 'react';
import { getImageForCard } from './GameBoard';
import towerGoodImg from '../../../board/board_tower.png';
import towerBadImg from '../../../board/board_tower_bad.png';
import knightPng from '../../../cards/card_knight.png';

const GameOverlays = ({ 
  prompt, 
  gameOverData, 
  attackCinematic, 
  abilityCinematic, 
  handlePromptResponse, 
  socketId,
  board,
  getCardData,
  surrenderConfirm,
  handleSurrenderResponse
}) => {
  return (
    <>
      {prompt && (
        <div className="prompt-overlay">
            <div className="prompt-box">
                <p>{prompt.message}</p>
                <div className="prompt-buttons">
                    <button onClick={() => handlePromptResponse("Atacar")}>⚔️ Atacar</button>
                    <button onClick={() => handlePromptResponse("Terminar Turno")}>🛑 Terminar Turno</button>
                </div>
            </div>
        </div>
      )}
      {surrenderConfirm && (
        <div className="action-prompt-overlay">
            <div className="action-prompt-box">
                <h3>¿Rendirse?</h3>
                <p style={{color: '#bdc3c7', marginBottom: '1.5rem'}}>
                    ¿Estás seguro de que quieres rendirte? Perderás la partida inmediatamente.
                </p>
                <div className="prompt-options">
                    <button 
                        className="prompt-btn primary" 
                        onClick={() => handleSurrenderResponse(true)}
                    >
                        🏳️ Sí, Rendirse
                    </button>
                    <button 
                        className="prompt-btn secondary" 
                        onClick={() => handleSurrenderResponse(false)}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
      )}
      {gameOverData && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h1 className={gameOverData.result === 'victory' ? 'victory-text' : 'defeat-text'}>
              {gameOverData.result === 'victory' ? '¡VICTORIA!' : 'DERROTA'}
            </h1>
            <p className="game-over-reason">{gameOverData.reason}</p>
            <button className="return-menu-btn" onClick={() => window.location.reload()}>
              Volver al Menú
            </button>
          </div>
        </div>
      )}

      {attackCinematic && (
        <div className="attack-cinematic-overlay">
          <div className="cinematic-content">
            <div className={`cinematic-card attacker ${attackCinematic.attackerOwner === socketId ? 'ally' : 'enemy'}`}>
              <img src={getImageForCard(attackCinematic.attackerId)} alt="Attacker" />
              <div className="cinematic-label">ATACANTE</div>
            </div>
            
            <div className="cinematic-vs">VS</div>
            
            <div className={`cinematic-card target ${attackCinematic.targetOwner === socketId ? 'ally' : 'enemy'} ${attackCinematic.isKill ? 'destroyed' : 'hit'}`}>
              <img src={attackCinematic.targetId === 'tower' ? (attackCinematic.targetOwner === socketId ? towerGoodImg : towerBadImg) : getImageForCard(attackCinematic.targetId)} alt="Target" />
              <div className="cinematic-label">DEFENSOR</div>
              <div className="cinematic-damage">-{attackCinematic.damage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Ability Cinematic Overlay */}
      {abilityCinematic && (() => {
        const casterUnit = board[abilityCinematic.unitPos.r][abilityCinematic.unitPos.c];
        const casterCard = casterUnit ? getCardData(casterUnit.id) : null;
        
        return (
          <div className="ability-cinematic-overlay">
            <div className="ability-cinematic-content">
              {/* Caster Card */}
              <div className="ability-caster-card">
                <img src={casterCard ? getImageForCard(casterCard.id) : knightPng} alt="Caster" />
                <div className="ability-caster-label">LANZANDO</div>
              </div>
              
              {/* Ability Name */}
              <div className="ability-name-display">
                <div className="ability-name-text">{abilityCinematic.abilityName}</div>
                <div className="ability-effect-icon">
                  {abilityCinematic.effects && abilityCinematic.effects.length > 0 && (
                    <>
                      {abilityCinematic.effects.some(e => e.effects?.some(ef => ef.type === 'damage')) && '💥'}
                      {abilityCinematic.effects.some(e => e.effects?.some(ef => ef.type === 'heal')) && '💚'}
                      {abilityCinematic.effects.some(e => e.effects?.some(ef => ef.type === 'buff')) && '📈'}
                      {abilityCinematic.effects.some(e => e.effects?.some(ef => ef.type === 'debuff')) && '📉'}
                    </>
                  )}
                </div>
              </div>
              
              {/* Effects Summary */}
              {abilityCinematic.effects && abilityCinematic.effects.length > 0 && (
                <div className="ability-effects-summary">
                  {abilityCinematic.effects.map((effect, idx) => (
                    <div key={idx} className="ability-effect-item">
                      {effect.effects.map((e, i) => (
                        <div key={i} className="ability-effect-detail">
                          {e.type === 'damage' && `💥 -${e.value}`}
                          {e.type === 'heal' && `💚 +${e.value}`}
                          {e.type === 'buff' && '📈 Buff'}
                          {e.type === 'debuff' && '📉 Debuff'}
                          {e.type === 'kill' && '💀 Eliminado'}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
};

export default GameOverlays;
