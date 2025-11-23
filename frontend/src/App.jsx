import React, { useState } from 'react';
import StartScreen from './components/StartScreen';
import RulesScreen from './components/RulesScreen';
import CardsScreen from './components/CardsScreen';
import SettingsScreen from './components/SettingsScreen';
import MatchmakingScreen from './components/MatchmakingScreen';
import { SoundProvider } from './context/SoundContext';
import { SocketProvider } from './context/SocketContext';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('start'); // 'start', 'rules', 'cards', 'settings', 'matchmaking'

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
  };

  return (
    <SocketProvider>
      <SoundProvider>
        {currentScreen === 'start' && <StartScreen onNavigate={navigateTo} />}
        {currentScreen === 'rules' && <RulesScreen onBack={() => navigateTo('start')} />}
        {currentScreen === 'cards' && <CardsScreen onBack={() => navigateTo('start')} />}
        {currentScreen === 'settings' && <SettingsScreen onBack={() => navigateTo('start')} />}
        {currentScreen === 'matchmaking' && <MatchmakingScreen onBack={() => navigateTo('start')} />}
      </SoundProvider>
    </SocketProvider>
  );
}

export default App;
