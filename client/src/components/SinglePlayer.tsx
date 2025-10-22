import React, { useState } from 'react';

interface SinglePlayerProps {
  onBack: () => void;
}

interface ConversationEntry {
  question: string;
  answer: string;
}

interface AIResponse {
  verdict: string;
  scoreChange: number;
  newScore: number;
  nextQuestion: string;
}

const SinglePlayer: React.FC<SinglePlayerProps> = ({ onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [verdict, setVerdict] = useState<string>('');
  const [consistencyScore, setConsistencyScore] = useState<number>(100);
  const [gameState, setGameState] = useState<'intro' | 'question' | 'verdict' | 'game-over'>('intro');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scoreChange, setScoreChange] = useState<number>(0);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [sessionId] = useState<string>(() => Date.now().toString());

  const handleStartGame = async () => {
    try {
      setIsLoading(true);
      // Start with a simple question to begin the conversation
      setCurrentQuestion("What is your greatest fear?");
      setGameState('question');
    } catch (error) {
      console.error('Error starting game:', error);
      setVerdict("Failed to start the game. Please try again.");
      setGameState('verdict');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    try {
      setIsLoading(true);
      
      // Add current Q&A to conversation history
      const newEntry: ConversationEntry = {
        question: currentQuestion,
        answer: userAnswer.trim()
      };
      const updatedHistory = [...conversationHistory, newEntry];
      setConversationHistory(updatedHistory);

      // Call the AI API
      const response = await fetch('http://localhost:5001/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory: updatedHistory,
          lastAnswer: newEntry,
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiResponse: AIResponse = await response.json();
      
      // Update game state
      setVerdict(aiResponse.verdict);
      setScoreChange(aiResponse.scoreChange);
      setConsistencyScore(aiResponse.newScore);
      setCurrentQuestion(aiResponse.nextQuestion);
      
      // Check for game over
      if (aiResponse.newScore <= 0) {
        setGameState('game-over');
      } else {
        setGameState('verdict');
      }
      
      setUserAnswer('');
    } catch (error) {
      console.error('Error submitting answer:', error);
      setVerdict("The AI Judge couldn't decide — your consistency remains the same.");
      setScoreChange(0);
      setGameState('verdict');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setGameState('question');
    setVerdict('');
    setScoreChange(0);
  };

  const handleRestart = () => {
    setGameState('intro');
    setConsistencyScore(100);
    setVerdict('');
    setCurrentQuestion('');
    setUserAnswer('');
    setScoreChange(0);
    setConversationHistory([]);
    // Generate new session ID for restart
    window.location.reload(); // Simple way to reset session
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Home
            </button>
            <div className="text-lg font-semibold text-gray-700">
              Consistency: {consistencyScore}%
            </div>
          </div>

          {gameState === 'intro' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Welcome to Slip
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                An AI Judge will test your philosophical consistency. 
                Your consistency score starts at 100% and decreases when you contradict yourself.
              </p>
              <button
                onClick={handleStartGame}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200"
              >
                {isLoading ? 'Starting...' : 'Start Game'}
              </button>
            </div>
          )}

          {gameState === 'question' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {currentQuestion}
              </h2>
              
              <div className="mb-6">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isLoading ? 'AI is judging...' : 'Submit Answer'}
              </button>
            </div>
          )}

          {gameState === 'verdict' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                AI Judge Verdict
              </h2>
              
              <div className="bg-gray-100 rounded-lg p-6 mb-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Consistency Score:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-800">{consistencyScore}%</span>
                      {scoreChange !== 0 && (
                        <span className={`text-lg font-semibold ${getScoreChangeColor(scoreChange)}`}>
                          {scoreChange > 0 ? '+' : ''}{scoreChange}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className={`${getScoreColor(consistencyScore)} h-4 rounded-full transition-all duration-500`}
                      style={{ width: `${consistencyScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-lg text-gray-700">
                    <strong>AI Judge:</strong> "{verdict}"
                  </p>
                </div>
              </div>
              
              <div className="space-x-4">
                <button
                  onClick={handleNextQuestion}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Continue
                </button>
                <button
                  onClick={onBack}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  End Game
                </button>
              </div>
            </div>
          )}

          {gameState === 'game-over' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-red-600 mb-6">
                Game Over
              </h2>
              
              <div className="bg-red-50 rounded-lg p-6 mb-6">
                <p className="text-xl text-red-800 mb-4">
                  You lost consistency!
                </p>
                <p className="text-lg text-gray-700 mb-4">
                  <strong>Final Score:</strong> {consistencyScore}%
                </p>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-lg text-gray-700">
                    <strong>AI Judge:</strong> "{verdict}"
                  </p>
                </div>
              </div>
              
              <div className="space-x-4">
                <button
                  onClick={handleRestart}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Play Again
                </button>
                <button
                  onClick={onBack}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SinglePlayer;