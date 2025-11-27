import React from 'react';
import './ActionHistory.css';

const ActionHistory = ({ actions }) => {
  const getActionIcon = (type) => {
    switch (type) {
      case 'summon': return '✨';
      case 'move': return '🚶';
      case 'attack': return '⚔️';
      case 'ability': return '🔮';
      default: return '📝';
    }
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'summon': return '#3498db';
      case 'move': return '#2ecc71';
      case 'attack': return '#e74c3c';
      case 'ability': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  const formatAction = (action) => {
    const PlayerName = () => (
      <span className={action.isMe ? 'player-me' : 'player-opponent'}>
        {action.player}
      </span>
    );

    switch (action.type) {
      case 'summon':
        return <><PlayerName /> invocó {action.cardName} en {action.position}</>;
      case 'move':
        return <><PlayerName /> movió {action.cardName} de {action.from} a {action.to}</>;
      case 'attack':
        return <><PlayerName /> atacó con {action.attacker} causando {action.damage} de daño</>;
      case 'ability':
        return <><PlayerName /> usó {action.abilityName} con {action.cardName}</>;
      default:
        return action.message || 'Acción desconocida';
    }
  };

  return (
    <div className="action-history-panel">
      <div className="action-history-header">
        <h3>📜 Historial</h3>
      </div>
      <div className="action-history-list">
        {actions.length === 0 ? (
          <div className="no-actions">
            <p>No hay acciones aún</p>
            <span>El historial aparecerá aquí</span>
          </div>
        ) : (
          actions.map((action) => (
            <div 
              key={action.id} 
              className="action-item"
              style={{ borderLeftColor: getActionColor(action.type) }}
            >
              <div className="action-icon" style={{ backgroundColor: getActionColor(action.type) }}>
                {getActionIcon(action.type)}
              </div>
              <div className="action-content">
                <div className="action-text">{formatAction(action)}</div>
                <div className="action-timestamp">{action.timestamp}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActionHistory;
