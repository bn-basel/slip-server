import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import Rules from './components/Rules';
import Settings from './components/Settings';
import Modes from './components/Modes';
import SinglePlayer from './components/SinglePlayer';
import Multiplayer from './components/Multiplayer';
import { v4 as uuidv4 } from 'uuid'; // ✅ Add this

type GameMode = 'home' | 'rules' | 'settings' | 'modes' | 'single' | 'multiplayer';

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('home');
  const [sessionId, setSessionId] = useState<string>(''); // ✅ Store session ID

  // Generate a new session ID each time user enters single-player mode
  useEffect(() => {
    if (gameMode === 'single') {
      const newId = uuidv4();
      setSessionId(newId);
      console.log('🎮 New Session Started:', newId);
    }
  }, [gameMode]);

  // Generate a fresh session ID when starting a new game
  const handleStartNewGame = () => {
    const newId = uuidv4();
    setSessionId(newId);
    console.log('🎮 Fresh Game Session:', newId);
  };

  const renderContent = () => {
    switch (gameMode) {
      case 'rules':
        return <Rules onBack={() => setGameMode('home')} onContinue={() => setGameMode('modes')} />;
      case 'settings':
        return <Settings onBack={() => setGameMode('home')} />;
      case 'modes':
        return <Modes onBack={() => setGameMode('home')} onModeSelect={setGameMode} />;
      case 'single':
        // ✅ Pass sessionId and startNewGame function to SinglePlayer component
        return <SinglePlayer sessionId={sessionId} onBack={() => setGameMode('home')} onStartNewGame={handleStartNewGame} />;
      case 'multiplayer':
        return <Multiplayer onBack={() => setGameMode('home')} />;
      default:
        return <HomePage onNavigate={setGameMode} />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {renderContent()}
    </div>
  );
}

export default App;
