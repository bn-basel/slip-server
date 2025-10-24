import React from 'react';

interface MultiplayerProps {
  onBack: () => void;
}

const Multiplayer: React.FC<MultiplayerProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Multiplayer Mode
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            Multiplayer functionality is coming soon! This will allow multiple players to compete in consistency challenges.
          </p>
          
          <button
            onClick={onBack}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Multiplayer;
