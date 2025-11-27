import React, { useState, useEffect } from 'react';
import './GameScreen.css';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import cardsData from '../../../card.json';
import { useTranslation } from 'react-i18next';

import ActionHistory from './ActionHistory';

// New Components
import GameBoard from './game/GameBoard';
import GameHand from './game/GameHand';
import GameSidePanel from './game/GameSidePanel';
import GameOverlays from './game/GameOverlays';

const getCardData = (cardId) => cardsData.find(c => c.id === cardId);

const GameScreen = ({ gameData }) => {
  const { t } = useTranslation();
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
  const [actionHistory, setActionHistory] = useState([]);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);

  const handleSurrenderResponse = (confirmed) => {
      setShowSurrenderConfirm(false);
      if (confirmed) {
          socket.emit('surrender', { gameId: gameState.gameId });
      }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('game_update', (data) => {
      const wasTurn = gameState.turn;
      const isTurn = data.turn;
      
      setGameState(data);
      setPrompt(null); 
      
      if (wasTurn !== isTurn) {
        setTimeout(() => {
            setTurnBannerText(isTurn ? t('game.turnBanner.yourTurn') : t('game.turnBanner.opponentTurn'));
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
      
      // Track attack action
      const attackerCard = getCardData(data.attackerId);
      const isMe = data.attackerOwner === socket.id;
      addActionToHistory({
        type: 'attack',
        player: isMe ? t('actionHistory.you') : opponent,
        isMe: isMe,
        attacker: attackerCard?.name || t('sidePanel.unitDetails'),
        damage: data.damage
      });
      
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
      
      // Track ability action
      const casterUnit = board[data.unitPos.r][data.unitPos.c];
      const casterCard = casterUnit ? getCardData(casterUnit.id) : null;
      const ability = casterUnit?.abilities[data.abilityIndex];
      const isMe = data.unitPos && board[data.unitPos.r][data.unitPos.c]?.owner === socket.id;
      
      addActionToHistory({
        type: 'ability',
        player: isMe ? t('actionHistory.you') : opponent,
        isMe: isMe,
        cardName: casterCard?.name || t('sidePanel.unitDetails'),
        abilityName: ability?.name || t('sidePanel.abilities')
      });
      
      setTimeout(() => {
        setAbilityCinematic(null);
      }, 3000);
    });

    socket.on('unit_summoned', (data) => {
      const card = getCardData(data.cardId);
      const visual = toVisual(data.pos.r, data.pos.c);
      const isMe = data.owner === socket.id;
      
      addActionToHistory({
        type: 'summon',
        player: isMe ? t('actionHistory.you') : opponent,
        isMe: isMe,
        cardName: card?.name || t('sidePanel.unitDetails'),
        position: `${String.fromCharCode(65 + visual.c)}${8 - visual.r}`
      });
    });

    socket.on('unit_moved', (data) => {
      const unit = board[data.from.r][data.from.c]; // Might be null if already moved in state, but we have unitId
      const card = getCardData(data.unitId); // We need to pass unitId in event or look it up
      const visualFrom = toVisual(data.from.r, data.from.c);
      const visualTo = toVisual(data.to.r, data.to.c);
      const isMe = data.owner === socket.id;

      addActionToHistory({
        type: 'move',
        player: isMe ? t('actionHistory.you') : opponent,
        isMe: isMe,
        cardName: card?.name || t('sidePanel.unitDetails'),
        from: `${String.fromCharCode(65 + visualFrom.c)}${8 - visualFrom.r}`,
        to: `${String.fromCharCode(65 + visualTo.c)}${8 - visualTo.r}`
      });
    });

    return () => {
      socket.off('game_update');
      socket.off('game_start');
      socket.off('action_prompt');
      socket.off('attack_result');
      socket.off('game_over');
      socket.off('ability_result');
      socket.off('unit_summoned');
      socket.off('unit_moved');
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

  const addActionToHistory = (action) => {
    const timestamp = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newAction = {
      id: Date.now() + Math.random(),
      timestamp,
      ...action
    };
    setActionHistory(prev => [newAction, ...prev].slice(0, 30)); // Keep last 30 actions
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
      const startR = isFlipped ? 0 : 7;
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
      <GameOverlays 
        prompt={prompt}
        gameOverData={gameOverData}
        attackCinematic={attackCinematic}
        abilityCinematic={abilityCinematic}
        handlePromptResponse={handlePromptResponse}
        socketId={socket.id}
        board={board}
        getCardData={getCardData}
        surrenderConfirm={showSurrenderConfirm}
        handleSurrenderResponse={handleSurrenderResponse}
      />

      {/* Left Panel - Action History */}
      <div className="game-left-panel">
        <ActionHistory actions={actionHistory} />
      </div>

      <div className="game-main-area">
        {showTurnBanner && <div className="turn-banner">{turnBannerText}</div>}
        
        <div className={`game-top-bar ${!turn ? 'your-turn' : ''}`}>
            <div className="player-info">
            <div className="avatar" style={{background: '#e74c3c'}}></div>
            <span className="player-name">{opponent}</span>
            </div>
            <div className="top-bar-center">
              <button 
                className="surrender-btn"
                onClick={() => setShowSurrenderConfirm(true)}
              >
                🏳️ {t('game.buttons.surrender')}
              </button>
            </div>
            <div className="opponent-hand">
            {hand && hand.map((_, i) => <div key={i} className="card-back-mini"></div>)}
            </div>
        </div>

        <GameBoard 
          board={board}
          validCells={validCells}
          animatingCells={animatingCells}
          destroyedCell={destroyedCell}
          selectedUnitPos={selectedUnitPos}
          handleBoardClickVisual={handleBoardClickVisual}
          isFlipped={isFlipped}
          player1Id={gameState.player1Id}
          socketId={socket.id}
          toLogical={toLogical}
        />

        <div className={`game-bottom-bar ${turn ? 'your-turn' : ''}`}>
            <div className="player-stats">
            <span>⚡ {t('game.stats.energy')}: {energy}/10</span>
            <span>{turn ? `🟢 ${t('game.stats.yourTurn')}` : `🔴 ${t('game.stats.opponentTurn')}`}</span>
            {selectedUnitPos && (
                <div style={{display: 'flex', gap: '0.5rem'}}>
                <button onClick={() => setMode('move')} style={{background: mode === 'move' ? '#3498db' : '#555', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold'}}>{t('game.buttons.move')}</button>
                <button onClick={() => setMode('attack')} style={{background: mode === 'attack' ? '#e74c3c' : '#555', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold'}}>{t('game.buttons.attack')}</button>
                </div>
            )}
            </div>
            
            <GameHand 
              hand={hand}
              selectedCardIndex={selectedCardIndex}
              handleCardClick={handleCardClick}
              getCardData={getCardData}
            />
        </div>
        
        <button className="end-turn-btn" onClick={handleEndTurn} disabled={!turn}>{t('game.buttons.endTurn')}</button>
      </div>

      <GameSidePanel 
        selectedCardData={selectedCardData}
        selectedUnitPos={selectedUnitPos}
        board={board}
        gameState={gameState}
        socketId={socket.id}
        energy={energy}
        handleAbilityClick={handleAbilityClick}
        getAbilityDescription={getAbilityDescription}
      />
    </div>
  );
};

export default GameScreen;
