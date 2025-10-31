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

  const isHost = useMemo(() => {
    if (!room) return false;
    const me = room.players.find(p => p.id === socket.id);
    return !!me?.isHost;
  }, [room, socket.id]);

  const iAmReady = useMemo(() => {
    if (!room) return false;
    const me = room.players.find(p => p.id === socket.id);
    return !!me?.ready;
  }, [room, socket.id]);

  const allReady = useMemo(() => {
    if (!room) return false;
    if (room.players.length < 2) return false;
    return room.players.every(p => p.ready);
  }, [room]);

  useEffect(() => {
    function onState(next: RoomState) {
      setRoom(next);
      setError(null);
      if (next?.started) {
        setPhase('started');
      } else if (next) {
        setPhase('lobby');
      }
    }
    function onError(payload: { message: string }) {
      setError(payload?.message || 'Unknown error');
    }
    function onStarted() {
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
    socket.emit('room:create', { name: name.trim() || 'Player' });
  }

  function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 5) {
      setError('Enter a valid 5-character code');
      return;
    }
    socket.emit('room:join', { code, name: name.trim() || 'Player' });
  }

  function toggleReady() {
    if (!room) return;
    socket.emit('room:setReady', { code: room.code, ready: !iAmReady });
  }

  function startGame() {
    if (!room) return;
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
                <button onClick={handleCreate} className="liquid-hover bg-gray-700 text-white font-bold py-3 px-6 rounded-lg">
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
                  <button onClick={handleJoin} className="liquid-hover bg-gray-700 text-white font-bold py-3 px-6 rounded-lg">
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


