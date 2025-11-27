import React, { useState, useEffect } from 'react';
import './MatchmakingScreen.css';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { useTranslation } from 'react-i18next';

const MatchmakingScreen = ({ onBack, onNavigate }) => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const { playSound } = useSound();
  const [playerName, setPlayerName] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'searching', 'matched', 'waiting_opponent'
  const [opponent, setOpponent] = useState(null);
  const [matchId, setMatchId] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('match_found', (data) => {
      setStatus('matched');
      setOpponent(data.opponent);
      setMatchId(data.matchId);
      playSound('click'); // Play sound on match
    });

    socket.on('game_start', (data) => {
      console.log('Game starting!', data);
      // Navigate to game screen with game data
      onNavigate('game', data);
    });

    return () => {
      socket.off('match_found');
      socket.off('game_start');
    };
  }, [socket, playSound, onNavigate]);

  const handleSearch = () => {
    if (!playerName.trim() || !socket) return;
    
    setStatus('searching');
    playSound('click');
    socket.emit('find_match', playerName);
  };

  const handleLeave = () => {
    if (socket) {
        socket.emit('leave_queue');
    }
    playSound('click');
    onBack();
  };

  const handleConfirm = () => {
    if (!socket || !matchId) return;
    setStatus('waiting_opponent');
    playSound('click');
    socket.emit('confirm_match', matchId);
  };

  return (
    <div className="matchmaking-screen">
      <div className="matchmaking-container">
        <h1 className="matchmaking-title">{t('matchmaking.title')}</h1>

        {status === 'idle' && (
          <>
            <div className="input-group">
              <label className="input-label">{t('matchmaking.nameLabel')}</label>
              <input 
                type="text" 
                className="name-input" 
                placeholder={t('matchmaking.namePlaceholder')}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <button 
              className="search-btn" 
              onClick={handleSearch}
              disabled={!playerName.trim()}
              onMouseEnter={() => playSound('hover')}
            >
              {t('matchmaking.searchButton')}
            </button>
          </>
        )}

        {status === 'searching' && (
          <div className="status-message">
            ⚔️ {t('matchmaking.searching')}
          </div>
        )}

        {status === 'matched' && (
          <div className="match-found">
            <h3>{t('matchmaking.matchFound')}</h3>
            <p>{t('matchmaking.opponent')} <strong>{opponent}</strong></p>
            <button 
              className="search-btn" 
              onClick={handleConfirm}
              style={{marginTop: '1rem', background: 'linear-gradient(135deg, #2ecc71, #27ae60)'}}
              onMouseEnter={() => playSound('hover')}
            >
              {t('matchmaking.confirmButton')}
            </button>
          </div>
        )}

        {status === 'waiting_opponent' && (
          <div className="status-message">
            ⏳ {t('matchmaking.waitingOpponent')}
          </div>
        )}
      </div>

      <button 
        className="back-btn" 
        onClick={handleLeave} 
        onMouseEnter={() => playSound('hover')}
        title="Volver al Menú"
      >
        <svg className="back-icon" viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
    </div>
  );
};

export default MatchmakingScreen;
