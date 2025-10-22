import React from 'react';

interface HomePageProps {
  onModeSelect: (mode: 'single' | 'multiplayer') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onModeSelect }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">
            Slip
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            A philosophical consistency game where an AI Judge tests your internal coherence.
            Your consistency score starts at 100% and decreases when you contradict yourself.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => onModeSelect('single')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200"
            >
              Start Game
            </button>
            
            <button
              onClick={() => onModeSelect('multiplayer')}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200"
            >
              Multiplayer (Coming Soon)
            </button>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>Single-player mode with AI Judge powered by GPT</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;