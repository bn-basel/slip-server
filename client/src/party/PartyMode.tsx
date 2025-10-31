import React, { useEffect, useMemo, useState } from 'react';
import { getSocket } from './socket';

type Phase = 'menu' | 'lobby' | 'started';

type Player = {
  id: string;
  name: string;
  ready: boolean;
  isHost: boolean;
};

type RoomState = {
  code: string;
  createdAt: number;
  started: boolean;
  players: Player[];
} | null;

interface PartyModeProps {
  onBack: () => void;
}

const PartyMode: React.FC<PartyModeProps> = ({ onBack }) => {
  const socket = useMemo(() => getSocket(), []);

  const [phase, setPhase] = useState<Phase>('menu');
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [room, setRoom] = useState<RoomState>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Track socket connection status
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      console.log('[PARTY MODE] Socket connected:', socket.id);
    }
    function onDisconnect() {
      setIsConnected(false);
      console.log('[PARTY MODE] Socket disconnected');
    }
    
    // Check initial connection status
    setIsConnected(socket.connected);
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  // Get current socket ID safely (may be undefined if not connected)
  const socketId = useMemo(() => socket.id || null, [socket.id, isConnected]);

  const isHost = useMemo(() => {
    if (!room || !socketId) return false;
    const me = room.players.find(p => p.id === socketId);
    return !!me?.isHost;
  }, [room, socketId]);

  const iAmReady = useMemo(() => {
    if (!room || !socketId) return false;
    const me = room.players.find(p => p.id === socketId);
    return !!me?.ready;
  }, [room, socketId]);

  const allReady = useMemo(() => {
    if (!room) return false;
    if (room.players.length < 2) return false;
    return room.players.every(p => p.ready);
  }, [room]);

  // Set up socket event listeners for room state updates
  useEffect(() => {
    function onState(next: RoomState) {
      console.log('[PARTY MODE] Room state received:', next);
      setRoom(next);
      setError(null);
      if (next?.started) {
        setPhase('started');
      } else if (next) {
        setPhase('lobby');
      }
    }
    function onError(payload: { message: string }) {
      console.error('[PARTY MODE] Room error:', payload?.message);
      setError(payload?.message || 'Unknown error');
    }
    function onStarted() {
      console.log('[PARTY MODE] Game started');
      setPhase('started');
    }
    
    socket.on('room:state', onState);
    socket.on('room:error', onError);
    socket.on('room:started', onStarted);
    
    return () => {
      socket.off('room:state', onState);
      socket.off('room:error', onError);
      socket.off('room:started', onStarted);
    };
  }, [socket]);

  function handleCreate() {
    if (!isConnected) {
      setError('Not connected to server. Please wait...');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a display name');
      return;
    }
    console.log('[PARTY MODE] Creating room with name:', name.trim());
    socket.emit('room:create', { name: name.trim() || 'Player' });
  }

  function handleJoin() {
    if (!isConnected) {
      setError('Not connected to server. Please wait...');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a display name');
      return;
    }
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 5) {
      setError('Enter a valid 5-character code');
      return;
    }
    console.log('[PARTY MODE] Joining room:', code, 'with name:', name.trim());
    socket.emit('room:join', { code, name: name.trim() || 'Player' });
  }

  function toggleReady() {
    if (!room || !isConnected) return;
    console.log('[PARTY MODE] Toggling ready status');
    socket.emit('room:setReady', { code: room.code, ready: !iAmReady });
  }

  function startGame() {
    if (!room || !isConnected) return;
    console.log('[PARTY MODE] Starting game');
    socket.emit('room:start', { code: room.code });
  }

  async function copyCode() {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setError('Code copied!');
      setTimeout(() => setError(null), 1200);
    } catch {
      setError('Copy failed');
      setTimeout(() => setError(null), 1200);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 text-center">
          {/* Connection status indicator */}
          <div className="mb-4 text-sm">
            {isConnected ? (
              <span className="text-green-400">● Connected</span>
            ) : (
              <span className="text-yellow-400">● Connecting...</span>
            )}
          </div>

          {phase === 'menu' && (
            <>
              <h2 className="text-3xl font-bold text-red-600 mb-6">Party Mode</h2>
              <div className="grid grid-cols-1 gap-4 mb-6 text-left">
                <label className="text-gray-300">Display Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-gray-800 text-white rounded px-4 py-3"
                />
              </div>
              {error && <div className="text-red-400 mb-4">{error}</div>}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleCreate} 
                  disabled={!isConnected}
                  className={`liquid-hover font-bold py-3 px-6 rounded-lg ${
                    isConnected 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Create Room
                </button>
                <div className="flex items-center gap-2">
                  <input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    maxLength={5}
                    className="bg-gray-800 text-white rounded px-4 py-3 w-28 tracking-widest text-center"
                  />
                  <button 
                    onClick={handleJoin} 
                    disabled={!isConnected}
                    className={`liquid-hover font-bold py-3 px-6 rounded-lg ${
                      isConnected 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Join
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <button onClick={onBack} className="liquid-hover bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Back</button>
              </div>
            </>
          )}

          {phase === 'lobby' && room && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="bg-gray-800 text-white px-3 py-2 rounded">Back</button>
                <div className="text-sm text-gray-400">Room created {new Date(room.createdAt).toLocaleTimeString()}</div>
              </div>
              <h2 className="text-3xl font-bold text-red-600 mb-2">Lobby</h2>
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="text-xl tracking-widest bg-gray-800 text-white rounded px-4 py-2">{room.code}</div>
                <button onClick={copyCode} className="bg-gray-800 text-white px-3 py-2 rounded">Copy</button>
              </div>
              {error && <div className="text-red-400 mb-4">{error}</div>}
              <ul className="text-left mb-6 divide-y divide-gray-800">
                {room.players.map(p => (
                  <li key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <span className="text-white font-semibold">{p.name}</span>
                      {p.isHost && <span className="ml-2 text-xs text-yellow-400">Host</span>}
                    </div>
                    <div className="text-sm">
                      {p.ready ? <span className="text-green-400">Ready</span> : <span className="text-gray-400">Not ready</span>}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-center gap-4">
                <button onClick={toggleReady} className="liquid-hover bg-gray-700 text-white font-bold py-3 px-6 rounded-lg">
                  {iAmReady ? 'Unready' : 'Ready Up'}
                </button>
                {isHost && (
                  <button
                    onClick={startGame}
                    disabled={!allReady}
                    className={`liquid-hover font-bold py-3 px-6 rounded-lg ${allReady ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                  >
                    Start Game
                  </button>
                )}
              </div>
            </>
          )}

          {phase === 'started' && room && (
            <>
              <h2 className="text-3xl font-bold text-red-600 mb-4">Game Started</h2>
              <div className="text-gray-300 mb-6">Room {room.code} — This is a placeholder. Hook in real gameplay next.</div>
              <div>
                <button onClick={onBack} className="liquid-hover bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Exit</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartyMode;


