import React from 'react';

interface ModesProps {
  onBack: () => void;
  onModeSelect: (mode: 'single' | 'multiplayer') => void;
}

const Modes: React.FC<ModesProps> = ({ onBack, onModeSelect }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold text-red-600 mb-12">
          Modes
        </h1>
        
        <div className="space-y-6">
          <button
            onClick={() => onModeSelect('single')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg"
          >
            Solo
          </button>
          
          <button
            onClick={() => onModeSelect('multiplayer')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg"
          >
            Party
          </button>
        </div>
        
        <div className="mt-12">
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg flex items-center mx-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modes;
