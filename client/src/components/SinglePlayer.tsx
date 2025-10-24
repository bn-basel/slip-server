import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Dynamic API base URL based on environment
const API_BASE_URL = process.env.NODE_ENV === "development" ? "http://localhost:5001" : "";

interface SinglePlayerProps {
  onBack: () => void;
  sessionId: string;
  onStartNewGame: () => void;
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

const SinglePlayer: React.FC<SinglePlayerProps> = ({ onBack, sessionId, onStartNewGame }) => {
  const { t, language } = useLanguage();
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [verdict, setVerdict] = useState<string>('');
  const [consistencyScore, setConsistencyScore] = useState<number>(100);
  const [gameState, setGameState] = useState<'intro' | 'question' | 'verdict' | 'game-over'>('intro');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scoreChange, setScoreChange] = useState<number>(0);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);

  const handleStartGame = async () => {
    try {
      setIsLoading(true);
      // Generate a fresh session ID for this new game
      onStartNewGame();
      // Reset all game state to ensure fresh start
      setConsistencyScore(100);
      setVerdict('');
      setCurrentQuestion('');
      setUserAnswer('');
      setScoreChange(0);
      setConversationHistory([]);
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
      const response = await fetch(`${API_BASE_URL}/api/ai`, {
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-900 rounded-lg shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('back')}
            </button>
            <div className="text-lg font-semibold text-white">
              {t('consistencyScore')} {consistencyScore}%
            </div>
          </div>

          {gameState === 'intro' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                {t('welcome')}
              </h2>
              {language === 'ar' && (
                <p className="text-red-400 mb-4 text-lg font-semibold">
                  {t('answerInEnglish')}
                </p>
              )}
              <p className="text-gray-300 mb-8 text-lg">
                {t('gameDescription')}
              </p>
              <button
                onClick={handleStartGame}
                disabled={isLoading}
                className={`${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'liquid-hover bg-gray-700'} text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg`}
              >
{isLoading ? t('starting') : t('startGame')}
              </button>
            </div>
          )}

          {gameState === 'question' && (
            <div className="text-center">
              <h2 
                className="text-2xl font-bold text-red-600 mb-6"
                style={{
                  textShadow: '0 0 10px rgba(255, 64, 64, 0.4), 0 0 20px rgba(255, 64, 64, 0.2)'
                }}
              >
                {t('question')}
              </h2>
              <p className="text-white text-lg mb-8">
                {currentQuestion}
              </p>
              
              <div className="mb-6">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={t('typeAnswer')}
                  className="w-full h-32 p-4 bg-gray-800 border border-gray-600 text-white rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400"
                />
              </div>
              
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim() || isLoading}
                className={`${(!userAnswer.trim() || isLoading) ? 'bg-gray-500 cursor-not-allowed' : 'liquid-hover bg-gray-700'} text-white font-bold py-3 px-6 rounded-lg shadow-lg`}
              >
{isLoading ? t('aiJudging') : t('submitAnswer')}
              </button>
            </div>
          )}

          {gameState === 'verdict' && (
            <div className="text-center">
              <h2 
                className="text-2xl font-bold text-red-600 mb-4"
                style={{
                  textShadow: '0 0 10px rgba(255, 64, 64, 0.4), 0 0 20px rgba(255, 64, 64, 0.2)'
                }}
              >
                {t('aiJudgeVerdict')}
              </h2>
              
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-white">{t('consistencyScore')}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-white">{consistencyScore}%</span>
                      {scoreChange !== 0 && (
                        <span className={`text-lg font-semibold ${getScoreChangeColor(scoreChange)}`}>
                          {scoreChange > 0 ? '+' : ''}{scoreChange}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <div 
                      className={`${getScoreColor(consistencyScore)} h-4 rounded-full transition-all duration-500`}
                      style={{ width: `${consistencyScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-lg text-white">
                    <strong>{t('aiJudge')}</strong> "{verdict}"
                  </p>
                </div>
              </div>
              
              <div className="space-x-4">
                <button
                  onClick={handleNextQuestion}
                  className="liquid-hover bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
                >
{t('continue')}
                </button>
                <button
                  onClick={onBack}
                  className="liquid-hover bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
                >
{t('endGame')}
                </button>
              </div>
            </div>
          )}

          {gameState === 'game-over' && (
            <div className="text-center">
              <h2 
                className="text-3xl font-bold text-red-600 mb-6"
                style={{
                  textShadow: '0 0 15px rgba(255, 64, 64, 0.5), 0 0 30px rgba(255, 64, 64, 0.3)'
                }}
              >
                {t('gameOver')}
              </h2>
              
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <p className="text-xl text-red-400 mb-4">
                  {t('lostConsistency')}
                </p>
                <p className="text-lg text-white mb-4">
                  <strong>{t('finalScore')}</strong> {consistencyScore}%
                </p>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-lg text-white">
                    <strong>{t('aiJudge')}</strong> "{verdict}"
                  </p>
                </div>
              </div>
              
              <div className="space-x-4">
                <button
                  onClick={handleRestart}
                  className="liquid-hover bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
                >
{t('playAgain')}
                </button>
                <button
                  onClick={onBack}
                  className="liquid-hover bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
                >
{t('back')}
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
