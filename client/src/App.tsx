import React, { useState } from 'react';
import HomePage from './components/HomePage';
import SinglePlayer from './components/SinglePlayer';
import Multiplayer from './components/Multiplayer';

type GameMode = 'home' | 'single' | 'multiplayer';

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('home');

  const renderContent = () => {
    switch (gameMode) {
      case 'single':
        return <SinglePlayer onBack={() => setGameMode('home')} />;
      case 'multiplayer':
        return <Multiplayer onBack={() => setGameMode('home')} />;
      default:
        return <HomePage onModeSelect={setGameMode} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {renderContent()}
    </div>
  );
}

export default App;
