import React, { useEffect, useState } from 'react';
import './StartScreen.css';
import { useSound } from '../context/SoundContext';
import { useSocket } from '../context/SocketContext';
import { useTranslation } from 'react-i18next';

const StartScreen = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [particles, setParticles] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const { playSound } = useSound();
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on("playerCount", (count) => {
        setPlayerCount(count);
      });
      
      // Request initial count because we might have missed the connection event
      // while the ServerAwakener was loading
      socket.emit("requestPlayerCount");
    }

    return () => {
      if (socket) {
        socket.off("playerCount");
      }
    };
  }, [socket]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 10 + 5}px`,
      duration: `${Math.random() * 10 + 10}s`,
      delay: `${Math.random() * 5}s`
    }));
    setParticles(newParticles);
  }, []);

  const handleMouseEnter = () => {
    playSound('hover');
  };

  const handleClick = (action) => {
    playSound('click');
    action();
  };

  const [showPlayModes, setShowPlayModes] = useState(false);

  const handlePlayClick = () => {
    playSound('click');
    setShowPlayModes(true);
  };

  const handleModeSelect = (mode) => {
    playSound('click');
    if (mode === 'online') {
      onNavigate('matchmaking');
    } else if (mode === 'solo') {
      // For solo, we might need a different flow or just emit event directly if we had a socket context here.
      // But StartScreen just navigates. We probably need a 'SoloScreen' or handle it in App.jsx.
      // Actually, let's navigate to a 'solo-loading' or just 'game' with a flag?
      // Better: Navigate to 'matchmaking' but with a prop? Or a new route 'solo'.
      // Let's assume onNavigate can take params or we handle 'solo' in App.jsx
      onNavigate('solo');
    }
    setShowPlayModes(false);
  };

  return (
    <div className="start-screen">
      {/* Background Particles */}
      <div className="particles">
        {particles.map(p => (
          <div 
            key={p.id} 
            className="particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay
            }}
          />
        ))}
      </div>

      {/* Decorative Background SVG (Shield) */}
      <svg className="bg-decoration" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
      </svg>

      <div className="title-container">
        <h1 className="game-title" dangerouslySetInnerHTML={{ __html: t('startScreen.title').replace(' ', '<br/>') }}></h1>
        <div className="player-count-badge">
          <span className="status-dot"></span>
          {playerCount} {playerCount === 1 ? t('startScreen.playerCount.player') : t('startScreen.playerCount.players')} {t('startScreen.playerCount.online')}
        </div>
      </div>

      <div className="menu-options">
        {!showPlayModes ? (
            <button 
            className="menu-btn" 
            onClick={handlePlayClick} 
            onMouseEnter={handleMouseEnter}
            >
            <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
            </svg>
            {t('startScreen.buttons.play')}
            </button>
        ) : (
            <div className="play-modes-container">
                <button 
                    className="menu-btn mode-btn" 
                    onClick={() => handleModeSelect('solo')}
                    onMouseEnter={handleMouseEnter}
                >
                    🤖 {t('startScreen.modes.solo')}
                </button>
                <button 
                    className="menu-btn mode-btn" 
                    onClick={() => handleModeSelect('online')}
                    onMouseEnter={handleMouseEnter}
                >
                    ⚔️ {t('startScreen.modes.online')}
                </button>
                <button 
                    className="back-small-btn"
                    onClick={() => { playSound('click'); setShowPlayModes(false); }}
                >
                    {t('startScreen.buttons.cancel')}
                </button>
            </div>
        )}
        
        {!showPlayModes && (
            <>
                <button 
                className="menu-btn" 
                onClick={() => handleClick(() => onNavigate('cards'))}
                onMouseEnter={handleMouseEnter}
                >
                <svg className="btn-icon" viewBox="0 0 24 24">
                    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
                </svg>
                {t('startScreen.buttons.cards')}
                </button>

                <button 
                className="menu-btn" 
                onClick={() => handleClick(() => onNavigate('rules'))}
                onMouseEnter={handleMouseEnter}
                >
                <svg className="btn-icon" viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
                {t('startScreen.buttons.rules')}
                </button>

                <button 
                className="menu-btn" 
                onClick={() => handleClick(() => onNavigate('settings'))}
                onMouseEnter={handleMouseEnter}
                style={{background: 'linear-gradient(135deg, #607d8b, #455a64)', boxShadow: '0 4px 0 #37474f, 0 10px 10px rgba(0,0,0,0.5)'}}
                >
                <svg className="btn-icon" viewBox="0 0 24 24">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                </svg>
                {t('startScreen.buttons.settings')}
                </button>
            </>
        )}
      </div>
    </div>
  );
};

export default StartScreen;
