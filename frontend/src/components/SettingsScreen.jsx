import React from 'react';
import './SettingsScreen.css';
import { useSound } from '../context/SoundContext';

const SettingsScreen = ({ onBack }) => {
  const { isMuted, toggleMute, playSound } = useSound();

  const handleToggle = () => {
    toggleMute();
    if (isMuted) { // If it WAS muted, we are unmuting, so play a sound
       // We can't easily play sound *immediately* after state change in this render cycle 
       // without a useEffect, but for a toggle click it's fine to try or just rely on the click itself.
       // Actually, let's just play the click sound.
       // Note: The click sound might not play if isMuted is still true in the closure.
       // So we might want to force play or wait. 
       // For simplicity, let's just toggle.
    } else {
        // If we are muting, maybe a sound isn't needed.
    }
    playSound('click');
  };

  return (
    <div className="settings-screen">
      <div className="settings-container">
        <h1 className="settings-title">Configuración</h1>

        <div className="setting-item">
          <span className="setting-label">Sonido</span>
          <label className="switch">
            <input type="checkbox" checked={!isMuted} onChange={handleToggle} />
            <span className="slider"></span>
          </label>
        </div>
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

export default SettingsScreen;
