import React, { useState } from 'react';
import StartScreen from './components/StartScreen';
import RulesScreen from './components/RulesScreen';
import CardsScreen from './components/CardsScreen';
import SettingsScreen from './components/SettingsScreen';
import MatchmakingScreen from './components/MatchmakingScreen';
import GameScreen from './components/GameScreen';
import { SoundProvider } from './context/SoundContext';
import { SocketProvider } from './context/SocketContext';
import SoloLoading from './components/SoloLoading';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('start'); // 'start', 'rules', 'cards', 'settings', 'matchmaking', 'game', 'solo'
  const [gameData, setGameData] = useState(null);

  const navigateTo = (screen, data = null) => {
    if (data) setGameData(data);
    setCurrentScreen(screen);
  };

  return (
    <SocketProvider>
      <SoundProvider>
        {currentScreen === 'start' && <StartScreen onNavigate={navigateTo} />}
        {currentScreen === 'rules' && <RulesScreen onBack={() => navigateTo('start')} />}
        {currentScreen === 'cards' && <CardsScreen onBack={() => navigateTo('start')} />}
        {currentScreen === 'settings' && <SettingsScreen onBack={() => navigateTo('start')} />}
        {currentScreen === 'matchmaking' && <MatchmakingScreen onBack={() => navigateTo('start')} onNavigate={navigateTo} />}
        {currentScreen === 'solo' && <SoloLoading onNavigate={navigateTo} />}
        {currentScreen === 'game' && <GameScreen gameData={gameData} />}
      </SoundProvider>
    </SocketProvider>
  );
}

export default App;
