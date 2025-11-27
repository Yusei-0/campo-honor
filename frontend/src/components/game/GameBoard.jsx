import React from 'react';
import towerGoodImg from '../../../board/board_tower.png';
import towerBadImg from '../../../board/board_tower_bad.png';
import knightPng from '../../../cards/card_knight.png';
import archerPng from '../../../cards/card_archer.png';
import magePng from '../../../cards/card_mage.png';
import shieldPng from '../../../cards/card_shield.png';
import lancerPng from '../../../cards/card_lancer.png';
import catapultPng from '../../../cards/card_catapult.png';
import healerPng from '../../../cards/card_healer.png';

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

const getHPClass = (hp, maxHp) => {
  const percentage = (hp / maxHp) * 100;
  if (percentage > 50) return 'high';
  if (percentage > 25) return 'medium';
  return 'low';
};

const GameBoard = ({ 
  board, 
  validCells, 
  animatingCells, 
  destroyedCell, 
  selectedUnitPos, 
  handleBoardClickVisual, 
  isFlipped, 
  player1Id, 
  socketId,
  toLogical 
}) => {

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
      const towerImg = cell?.owner === player1Id ? towerGoodImg : towerBadImg;

      return (
        <div 
          key={cellKey} 
          className={`board-cell ${isValid === 'spawn' ? 'valid-spawn' : ''} ${isValid === 'move' ? 'valid-move' : ''} ${isValid === 'attack' ? 'in-attack-range' : ''} ${isValid?.startsWith('ability-') ? isValid : ''}`}
          onClick={() => handleBoardClickVisual(visualR, visualC)} 
        >
          {/* Coordinates Overlay */}
          {visualC === 0 && <div className="coord-rank">{isFlipped ? visualR + 1 : 8 - visualR}</div>}
          {visualR === 7 && <div className="coord-file">{String.fromCharCode(65 + (isFlipped ? 6 - visualC : visualC))}</div>}

          {cell && cell.type === 'tower' && (
            <div className={`tower-container ${animClass === 'damage' ? 'taking-damage' : ''}`} style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
              <img src={towerImg} alt="tower" style={{width: '70%', height: '70%', objectFit: 'contain'}} />
              <div className="tower-hp">{cell.hp}/{cell.maxHp}</div>
            </div>
          )}
          {cell && cell.type === 'unit' && (
            <div className={`unit-container ${isSelected ? 'selected-attacker' : ''} ${animClass === 'spawn' ? 'just-spawned' : ''} ${animClass === 'move' ? 'moving' : ''} ${animClass === 'attack' ? 'attacking' : ''} ${animClass === 'damage' ? 'taking-damage' : ''} ${isDestroyed ? 'unit-destroyed' : ''}`} style={{width: '80%', height: '80%', background: cell.owner === socketId ? '#3498db' : '#e74c3c', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
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

  return (
    <div className="game-board-container">
        <div className="game-board">
        {Array(8).fill(0).map((_, r) => 
            Array(7).fill(0).map((_, c) => renderCell(r, c))
        )}
        </div>
    </div>
  );
};

export default GameBoard;
export { getImageForCard }; // Export helper for other components
