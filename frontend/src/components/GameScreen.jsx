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
  const { socket } = useSocket();
  const { playSound } = useSound();
  const [gameState, setGameState] = useState(gameData);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [selectedUnitPos, setSelectedUnitPos] = useState(null);
  const [mode, setMode] = useState('summon');
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [turnBannerText, setTurnBannerText] = useState('');
  const [animatingCells, setAnimatingCells] = useState({});
  const [attackCinematic, setAttackCinematic] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [destroyedCell, setDestroyedCell] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [selectedAbility, setSelectedAbility] = useState(null); // {unitPos, abilityIndex, ability}
  const [abilityCinematic, setAbilityCinematic] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('game_update', (data) => {
      const wasTurn = gameState.turn;
      const isTurn = data.turn;
      
      setGameState(data);
      setPrompt(null); 
      
      if (wasTurn !== isTurn) {
        setTimeout(() => {
            setTurnBannerText(isTurn ? '¡TU TURNO!' : 'TURNO DEL OPONENTE');
            setShowTurnBanner(true);
            setTimeout(() => setShowTurnBanner(false), 2000);
        }, attackCinematic ? 3000 : 0);
      }
      
      if (!attackCinematic) {
          setSelectedCardIndex(null);
          setSelectedUnitPos(null);
          setMode('summon');
      }
    });

    socket.on('game_start', (data) => {
        setGameState(data);
        setPrompt(null);
    });

    socket.on('action_prompt', (data) => {
        setPrompt(data);
    });

    socket.on('attack_result', (data) => {
      setAttackCinematic(data);
      playSound('attack'); 
      
      if (data.isKill) {
        setTimeout(() => {
          setDestroyedCell(data.to); 
          playSound('destroy');
        }, 1500); 
      }

      setTimeout(() => {
        setAttackCinematic(null);
        setDestroyedCell(null);
      }, 3000); 
    });

    socket.on('game_over', (data) => {
      setGameOverData(data);
    });

    socket.on('ability_result', (data) => {
      setAbilityCinematic(data);
      playSound('attack'); // Reuse attack sound for now
      
      setTimeout(() => {
        setAbilityCinematic(null);
      }, 3000);
    });

    return () => {
      socket.off('game_update');
      socket.off('game_start');
      socket.off('action_prompt');
      socket.off('attack_result');
      socket.off('game_over');
      socket.off('ability_result');
    };
  }, [socket, gameState.turn, attackCinematic, playSound]);

  const handleCardClick = (index) => {
    if (!gameState.turn) return;
    if (selectedCardIndex === index) {
      setSelectedCardIndex(null);
      setMode('summon');
    } else {
      setSelectedCardIndex(index);
      setSelectedUnitPos(null);
      setSelectedAbility(null);
      setMode('summon');
      playSound('click');
    }
  };

  const getAbilityDescription = (ability) => {
    const parts = [];
    
    // Type
    if (ability.abilityType === 'passive') {
      const triggerText = {
        'onKill': 'Al matar',
        'onStartTurn': 'Al inicio del turno',
        'onBeingDamaged': 'Al recibir daño'
      };
      parts.push(`🔄 ${triggerText[ability.trigger] || 'Pasiva'}`);
    }
    
    // Damage
    if (ability.damage) {
      parts.push(`💥 ${ability.damage} de daño`);
      if (ability.ignoresDefense) parts.push('(ignora defensa)');
    }
    
    // Healing
    if (ability.heal) {
      parts.push(`💚 Cura ${ability.heal} HP`);
    }
    
    // Buffs
    if (ability.buff) {
      const buffParts = [];
      if (ability.buff.attack) buffParts.push(`+${ability.buff.attack} ATQ`);
      if (ability.buff.defense) buffParts.push(`+${ability.buff.defense} DEF`);
      if (ability.buff.speed) buffParts.push(`+${ability.buff.speed} VEL`);
      if (buffParts.length > 0) {
        parts.push(`📈 ${buffParts.join(', ')}`);
        if (ability.buff.durationTurns) {
          parts.push(`(${ability.buff.durationTurns} turnos)`);
        } else {
          parts.push('(permanente)');
        }
      }
    }
    
    // Debuffs
    if (ability.debuff) {
      const debuffParts = [];
      if (ability.debuff.attack) debuffParts.push(`-${ability.debuff.attack} ATQ`);
      if (ability.debuff.defense) debuffParts.push(`-${ability.debuff.defense} DEF`);
      if (ability.debuff.speed) debuffParts.push(`-${ability.debuff.speed} VEL`);
      if (debuffParts.length > 0) {
        parts.push(`📉 ${debuffParts.join(', ')}`);
        if (ability.debuff.durationTurns) {
          parts.push(`(${ability.debuff.durationTurns} turnos)`);
        }
      }
    }
    
    // Area of Effect
    if (ability.areaEffect) {
      parts.push(`🌐 Área ${ability.areaSize}x${ability.areaSize}`);
      if (ability.friendlyFire) parts.push('⚠️ Daño aliado');
    }
    
    // Range
    if (ability.range) {
      parts.push(`🎯 Rango: ${ability.range}`);
    }
    
    // Target
    const targetText = {
      'self': 'Propio',
      'ally': 'Aliado',
      'enemy': 'Enemigo',
      'allAllies': 'Todos los aliados',
      'allEnemies': 'Todos los enemigos',
      'tile': 'Casilla'
    };
    if (ability.target && targetText[ability.target]) {
      parts.push(`👤 ${targetText[ability.target]}`);
    }
    
    return parts.join(' • ');
  };

  const handleAbilityClick = (abilityIndex) => {
    if (!selectedUnitPos) return;
    const unit = board[selectedUnitPos.r][selectedUnitPos.c];
    if (!unit || !unit.abilities || abilityIndex >= unit.abilities.length) return;
    
    const ability = unit.abilities[abilityIndex];
    if (ability.abilityType !== 'active') return;
    
    // Set ability as selected and enter ability targeting mode
    setSelectedAbility({
      unitPos: selectedUnitPos,
      abilityIndex,
      ability
    });
    setMode('ability');
    playSound('click');
  };

  const getValidAbilityTargets = () => {
    if (!selectedAbility || mode !== 'ability') return {};
    
    const { ability, unitPos } = selectedAbility;
    const valid = {};
    
    // Self-targeting abilities
    if (ability.target === 'self') {
      const visual = toVisual(unitPos.r, unitPos.c);
      valid[`${visual.r}-${visual.c}`] = 'ability-self';
      return valid;
    }
    
    // All allies/enemies don't need visual highlighting (auto-target)
    if (ability.target === 'allAllies' || ability.target === 'allEnemies') {
      return valid;
    }
    
    // Single target or tile abilities
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const cell = board[r][c];
        const dist = Math.abs(unitPos.r - r) + Math.abs(unitPos.c - c);
        
        // Check range
        if (ability.range && dist > ability.range) continue;
        
        // Check target type
        let isValid = false;
        if (ability.target === 'tile') {
          isValid = true;
        } else if (ability.target === 'ally' && cell && cell.owner === socket.id) {
          isValid = true;
        } else if (ability.target === 'enemy' && cell && cell.owner !== socket.id) {
          isValid = true;
        }
        
        if (isValid) {
          const visual = toVisual(r, c);
          valid[`${visual.r}-${visual.c}`] = `ability-${ability.target}`;
        }
      }
    }
    
    return valid;
  };

  const handleBoardClick = (r, c) => {
    // Always allow viewing details of any unit
    const clickedCell = gameState.board[r][c];
    
    if (!gameState.turn) {
        // If not my turn, allow viewing details
        if (clickedCell && clickedCell.type === 'unit') {
             setSelectedUnitPos({ r, c });
             setSelectedCardIndex(null);
             setMode('view');
             playSound('click');
        }
        return;
    }

    // Ability Targeting Logic (Priority over attack)
    if (mode === 'ability' && selectedAbility) {
      const { unitPos, abilityIndex, ability } = selectedAbility;
      
      // Emit use_ability event
      socket.emit('use_ability', {
        gameId: gameState.gameId,
        unitPos,
        abilityIndex,
        targetPos: { r, c }
      });
      
      // Reset ability selection
      setSelectedAbility(null);
      setMode('move');
      playSound('click');
      return;
    }

    // Attack Logic (Priority over viewing)
    if (mode === 'attack' && selectedUnitPos && clickedCell && clickedCell.owner !== socket.id) {
      socket.emit('attack_unit', { gameId: gameState.gameId, from: selectedUnitPos, to: { r, c } });
      // Animation handled by cinematic now
      return;
    }

    // View Details Logic (Only if not attacking)
    if (clickedCell && clickedCell.type === 'unit' && clickedCell.owner !== socket.id) {
        setSelectedUnitPos({ r, c });
        setSelectedCardIndex(null);
        setMode('view'); 
        playSound('click');
        return;
    }
    
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
  };

  const { hand, energy, opponent, turn, board } = gameState;
  const isFlipped = socket.id === gameState.player2Id;

  const toVisual = (r, c) => isFlipped ? { r: 7 - r, c: 6 - c } : { r, c };
  const toLogical = (r, c) => isFlipped ? { r: 7 - r, c: 6 - c } : { r, c };

  const getValidCells = () => {
    const valid = {};
    if (!gameState.turn) return valid;

    // Ability targeting has priority
    if (mode === 'ability' && selectedAbility) {
      return getValidAbilityTargets();
    }

    if (mode === 'summon' && selectedCardIndex !== null) {
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

  const handleBoardClickVisual = (visualR, visualC) => {
      const { r, c } = toLogical(visualR, visualC);
      handleBoardClick(r, c);
  };

  const renderCell = (visualR, visualC) => {
      const { r, c } = toLogical(visualR, visualC);
      const cell = board[r][c];
      const cellKey = `${visualR}-${visualC}`; 
      const isValid = validCells[cellKey];
      
      const isSelected = selectedUnitPos && selectedUnitPos.r === r && selectedUnitPos.c === c;
      const animClass = animatingCells[`${r}-${c}`]; 
      const isDestroyed = destroyedCell && destroyedCell.r === r && destroyedCell.c === c;

      // Tower Image Logic:
      // Bind image to the owner's identity (P1 = Good/Blue, P2 = Bad/Red)
      // This ensures P2 sees their specific tower (Red) at the bottom.
      const towerImg = cell?.owner === gameState.player1Id ? towerGoodImg : towerBadImg;

      return (
        <div 
          key={cellKey} 
          className={`board-cell ${isValid === 'spawn' ? 'valid-spawn' : ''} ${isValid === 'move' ? 'valid-move' : ''} ${isValid === 'attack' ? 'in-attack-range' : ''} ${isValid?.startsWith('ability-') ? isValid : ''}`}
          onClick={() => handleBoardClickVisual(visualR, visualC)} 
        >
          {/* Coordinates Overlay: 
              P1 (Standard): Visual 7 (Bottom) is Rank 1. 
              P2 (Flipped): Visual 7 (Bottom) is Rank 8. 
          */}
          {visualC === 0 && <div className="coord-rank">{isFlipped ? visualR + 1 : 8 - visualR}</div>}
          {/* Files: A-G. 
              P1: Visual 0 is A. 
              P2: Visual 0 is G. 
          */}
          {visualR === 7 && <div className="coord-file">{String.fromCharCode(65 + (isFlipped ? 6 - visualC : visualC))}</div>}

          {cell && cell.type === 'tower' && (
            <div className={`tower-container ${animClass === 'damage' ? 'taking-damage' : ''}`} style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
              <img src={towerImg} alt="tower" style={{width: '70%', height: '70%', objectFit: 'contain'}} />
              <div className="tower-hp">{cell.hp}/{cell.maxHp}</div>
            </div>
          )}
          {cell && cell.type === 'unit' && (
            <div className={`unit-container ${isSelected ? 'selected-attacker' : ''} ${animClass === 'spawn' ? 'just-spawned' : ''} ${animClass === 'move' ? 'moving' : ''} ${animClass === 'attack' ? 'attacking' : ''} ${animClass === 'damage' ? 'taking-damage' : ''} ${isDestroyed ? 'unit-destroyed' : ''}`} style={{width: '80%', height: '80%', background: cell.owner === socket.id ? '#3498db' : '#e74c3c', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
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

  const handlePromptResponse = (response) => {
      if (response === "Atacar") {
          setPrompt(null);
          // User stays in turn to attack
      } else {
          setPrompt(null);
          socket.emit("end_turn", { gameId: gameState.gameId });
      }
  };

  return (
    <div className="game-screen-layout">
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
            <div className={`cinematic-card attacker ${attackCinematic.attackerOwner === socket.id ? 'ally' : 'enemy'}`}>
              <img src={getImageForCard(attackCinematic.attackerId)} alt="Attacker" />
              <div className="cinematic-label">ATACANTE</div>
            </div>
            
            <div className="cinematic-vs">VS</div>
            
            <div className={`cinematic-card target ${attackCinematic.targetOwner === socket.id ? 'ally' : 'enemy'} ${attackCinematic.isKill ? 'destroyed' : 'hit'}`}>
              <img src={attackCinematic.targetId === 'tower' ? (attackCinematic.targetOwner === socket.id ? towerGoodImg : towerBadImg) : getImageForCard(attackCinematic.targetId)} alt="Target" />
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

      <div className="game-side-panel">
        <h3 className="panel-title">Detalles</h3>
        {selectedCardData ? (
            <div className="card-details">
                <div className="detail-image-container">
                    <img src={getImageForCard(selectedCardData.id)} alt={selectedCardData.name} />
                </div>
                <h4>{selectedCardData.name}</h4>
                <p className="detail-desc">{selectedCardData.description}</p>
                
                {/* Ability Section - Now FIRST */}
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
                        {ability.abilityType === 'active' && gameState.turn && selectedUnitPos && board[selectedUnitPos.r][selectedUnitPos.c]?.owner === socket.id && (
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
                
                {/* Stats Section - Now SECOND */}
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
    </div>
  );
};

export default GameScreen;
