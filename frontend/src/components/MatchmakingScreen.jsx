import React, { useState, useEffect } from 'react';
import './MatchmakingScreen.css';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';

const MatchmakingScreen = ({ onBack }) => {
  const socket = useSocket();
  const { playSound } = useSound();
  const [playerName, setPlayerName] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'searching', 'matched'
  const [opponent, setOpponent] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('match_found', (data) => {
      setStatus('matched');
      setOpponent(data.opponent);
      playSound('click'); // Play sound on match
    });

    return () => {
      socket.off('match_found');
    };
  }, [socket, playSound]);

  const handleSearch = () => {
    if (!playerName.trim() || !socket) return;
    
    setStatus('searching');
    playSound('click');
    socket.emit('find_match', playerName);
  };

  return (
    <div className="matchmaking-screen">
      <div className="matchmaking-container">
        <h1 className="matchmaking-title">Buscar Partida</h1>

        {status === 'idle' && (
          <>
            <div className="input-group">
              <label className="input-label">Tu Nombre de Guerrero</label>
              <input 
                type="text" 
                className="name-input" 
                placeholder="Ej. Sir Lancelot"
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
              Buscar Oponente
            </button>
          </>
        )}

        {status === 'searching' && (
          <div className="status-message">
            ⚔️ Buscando oponente digno...
          </div>
        )}

        {status === 'matched' && (
          <div className="match-found">
            <h3>¡Partida Encontrada!</h3>
            <p>Tu oponente es: <strong>{opponent}</strong></p>
          </div>
        )}
      </div>

      <button 
        className="back-btn" 
        onClick={() => { playSound('click'); onBack(); }} 
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
