import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import Rules from './components/Rules';
import Settings from './components/Settings';
import Modes from './components/Modes';
import SinglePlayer from './components/SinglePlayer';
import Multiplayer from './components/Multiplayer';
import { v4 as uuidv4 } from 'uuid';

type GameMode = 'home' | 'rules' | 'settings' | 'modes' | 'single' | 'multiplayer';

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('home');
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize persistent sessionId from localStorage on app load
  useEffect(() => {
    const storedSessionId = localStorage.getItem('slip-session-id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      console.log('🎮 Using existing session:', storedSessionId);
    } else {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem('slip-session-id', newSessionId);
      console.log('🎮 Created new persistent session:', newSessionId);
    }
  }, []); // Only run once on app mount

  // Generate a fresh session ID when starting a new game
  const handleStartNewGame = () => {
    const newId = uuidv4();
    setSessionId(newId);
    localStorage.setItem('slip-session-id', newId);
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
