import React from 'react';
import './ActionHistory.css';
import { useTranslation } from 'react-i18next';

const ActionHistory = ({ actions }) => {
  const { t } = useTranslation();

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
        {action.isMe ? t('actionHistory.you') : action.player}
      </span>
    );

    switch (action.type) {
      case 'summon':
        return <><PlayerName /> {t('actionHistory.actions.summoned')} {action.cardName} {t('actionHistory.actions.in')} {action.position}</>;
      case 'move':
        return <><PlayerName /> {t('actionHistory.actions.moved')} {action.cardName} {t('actionHistory.actions.from')} {action.from} {t('actionHistory.actions.to')} {action.to}</>;
      case 'attack':
        return <><PlayerName /> {t('actionHistory.actions.attacked')} {action.attacker} {t('actionHistory.actions.causing')} {action.damage} {t('actionHistory.actions.damage')}</>;
      case 'ability':
        return <><PlayerName /> {t('actionHistory.actions.used')} {action.abilityName} {t('actionHistory.actions.with')} {action.cardName}</>;
      default:
        return action.message || t('actionHistory.empty');
    }
  };

  return (
    <div className="action-history-panel">
      <div className="action-history-header">
        <h3>📜 {t('actionHistory.title')}</h3>
      </div>
      <div className="action-history-list">
        {actions.length === 0 ? (
          <div className="no-actions">
            <p>{t('actionHistory.empty')}</p>
            <span>{t('actionHistory.emptySubtext')}</span>
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
