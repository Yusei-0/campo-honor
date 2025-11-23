import React, { useEffect, useState } from 'react';
import './StartScreen.css';
import { useSound } from '../context/SoundContext';

const StartScreen = ({ onNavigate }) => {
  const [particles, setParticles] = useState([]);
  const { playSound } = useSound();

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
        <h1 className="game-title">Campo<br/>de Honor</h1>
      </div>

      <div className="menu-options">
        <button 
          className="menu-btn" 
          onClick={() => handleClick(() => onNavigate('matchmaking'))} 
          onMouseEnter={handleMouseEnter}
        >
          <svg className="btn-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          Buscar Partida
        </button>
        
        <button 
          className="menu-btn" 
          onClick={() => handleClick(() => onNavigate('cards'))}
          onMouseEnter={handleMouseEnter}
        >
          <svg className="btn-icon" viewBox="0 0 24 24">
            <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
          </svg>
          Cartas
        </button>

        <button 
          className="menu-btn" 
          onClick={() => handleClick(() => onNavigate('rules'))}
          onMouseEnter={handleMouseEnter}
        >
          <svg className="btn-icon" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          Reglas
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
          Configuración
        </button>
      </div>
    </div>
  );
};

export default StartScreen;
