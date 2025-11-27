import React from 'react';
import './SettingsScreen.css';
import { useSound } from '../context/SoundContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';

const SettingsScreen = ({ onBack }) => {
  const { t } = useTranslation();
  const { isMuted, toggleMute, playSound } = useSound();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();

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

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
    playSound('click');
  };

  return (
    <div className="settings-screen">
      <div className="settings-container">
        <h1 className="settings-title">{t('settings.title')}</h1>

        <div className="setting-item">
          <span className="setting-label">{t('settings.sound')}</span>
          <label className="switch">
            <input type="checkbox" checked={!isMuted} onChange={handleToggle} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <span className="setting-label">{t('settings.language')}</span>
          <select 
            value={currentLanguage} 
            onChange={handleLanguageChange}
            className="language-select"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '2px solid #3498db',
              background: 'linear-gradient(135deg, #2c3e50, #34495e)',
              color: 'white',
              fontSize: '1rem',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 'bold'
            }}
          >
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button 
        className="back-btn" 
        onClick={() => { playSound('click'); onBack(); }} 
        onMouseEnter={() => playSound('hover')}
        title={t('common.back')}
      >
        <svg className="back-icon" viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
    </div>
  );
};

export default SettingsScreen;
