import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  score: number;
}

interface Answer {
  playerId: string;
  playerName: string;
  answer: string;
}

interface MultiplayerProps {
  onBack: () => void;
}

const Multiplayer: React.FC<MultiplayerProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'lobby' | 'room' | 'question' | 'answering' | 'voting' | 'results'>('lobby');
  const [playerName, setPlayerName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [votedPlayerId, setVotedPlayerId] = useState<string>('');
  const [roundResults, setRoundResults] = useState<any>(null);
  const [isQuestionMaster, setIsQuestionMaster] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [waitingMessage, setWaitingMessage] = useState<string>('');

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('joined-room', (data) => {
      setGameState('room');
      setPlayers(data.players);
    });

    newSocket.on('room-created', (data) => {
      setGameState('room');
      setRoomId(data.roomId);
      setPlayers(data.players);
    });

    newSocket.on('player-joined', (data) => {
      setPlayers(data.players);
    });

    newSocket.on('player-left', (data) => {
      setPlayers(data.players);
    });

    newSocket.on('game-started', (data) => {
      setGameState('question');
      setCurrentQuestion(data.question);
      setIsQuestionMaster(data.questionMaster === newSocket.id);
    });

    newSocket.on('answer-submitted', (data) => {
      setWaitingMessage(`${data.playerName} submitted an answer (${data.answersReceived}/${data.totalAnswers})`);
    });

    newSocket.on('vote-submitted', (data) => {
      setWaitingMessage(`${data.playerName} submitted a vote (${data.votesReceived}/${data.totalVotes})`);
    });

    newSocket.on('voting-phase', (data) => {
      setGameState('voting');
      setAnswers(data.answers);
    });

    newSocket.on('round-results', (data) => {
      setGameState('results');
      setRoundResults(data);
      // Update players with correct scores
      setPlayers(prevPlayers => 
        prevPlayers.map(player => {
          const scoreData = data.scores.find((p: any) => p.name === player.name);
          return {
            ...player,
            score: scoreData ? scoreData.score : player.score
          };
        })
      );
    });

    newSocket.on('next-round', (data) => {
      setGameState('question');
      setCurrentQuestion(data.question);
      setIsQuestionMaster(data.questionMaster === newSocket.id);
      setUserAnswer('');
      setAnswers([]);
      setVotedPlayerId('');
      setRoundResults(null);
    });

    newSocket.on('error', (data) => {
      alert(data.message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleCreateRoom = () => {
    if (playerName.trim() && socket) {
      socket.emit('create-room', { playerName: playerName.trim() });
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomId.trim() && socket) {
      socket.emit('join-room', { roomId: roomId.trim().toUpperCase(), playerName: playerName.trim() });
    }
  };

  const handleStartGame = () => {
    if (socket) {
      socket.emit('start-game', roomId);
    }
  };

  const handleSubmitAnswer = () => {
    if (userAnswer.trim() && socket) {
      socket.emit('submit-answer', { roomId, answer: userAnswer.trim() });
      setUserAnswer('');
    }
  };

  const handleVote = (playerId: string) => {
    if (socket) {
      socket.emit('submit-vote', { roomId, votedPlayerId: playerId });
      setVotedPlayerId(playerId);
    }
  };

  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="mb-6">
              <button
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Home
              </button>
            </div>

            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
              Multiplayer
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleCreateRoom}
                  disabled={!playerName.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Create Room
                </button>

                <div className="text-center text-gray-500">or</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={!playerName.trim() || !roomId.trim()}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'room') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="mb-6">
              <button
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Home
              </button>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Room: {roomId}
              </h2>
              <p className="text-gray-600">
                Share this room code with your friends!
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Players ({players.length}/8)
              </h3>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{player.name}</span>
                    <span className="text-sm text-gray-500">Score: {player.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {players.length >= 2 && (
              <button
                onClick={handleStartGame}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Start Game
              </button>
            )}

            {players.length < 2 && (
              <p className="text-center text-gray-500">
                Waiting for more players to join...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'question') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {currentQuestion}
              </h2>
              {isQuestionMaster && (
                <p className="text-blue-600 font-semibold">
                  You are the question master this round!
                </p>
              )}
            </div>

            {!isQuestionMaster && (
              <div className="space-y-4">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Submit Answer
                </button>
              </div>
            )}

            {isQuestionMaster && (
              <div className="text-center text-gray-600">
                <p>Wait for other players to submit their answers...</p>
                {waitingMessage && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-700">{waitingMessage}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'voting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              Vote for the answer that "slips" the most!
            </h2>

            <div className="space-y-4">
              {answers.map((answer, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-2">
                    <strong>{answer.playerName}:</strong>
                  </div>
                  <div className="text-gray-700 mb-3">
                    "{answer.answer}"
                  </div>
                  <button
                    onClick={() => handleVote(answer.playerId)}
                    disabled={votedPlayerId !== ''}
                    className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    {votedPlayerId === answer.playerId ? 'Voted!' : 'Vote for this answer'}
                  </button>
                </div>
              ))}
            </div>

            {votedPlayerId && (
              <div className="text-center mt-6 text-gray-600">
                <p>Waiting for other players to vote...</p>
                {waitingMessage && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-green-700">{waitingMessage}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              Round Results
            </h2>

            {roundResults && (
              <div className="text-center mb-6">
                <div className="bg-yellow-100 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    🏆 Winner: {roundResults.winner.playerName}
                  </h3>
                  <p className="text-yellow-700">
                    "{roundResults.winner.answer}"
                  </p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Current Scores
              </h3>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{player.name}</span>
                    <span className="text-lg font-bold text-blue-600">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-gray-600">
              <p>Next round starting soon...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Multiplayer;
