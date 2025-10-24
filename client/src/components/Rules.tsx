import React from 'react';

interface RulesProps {
  onBack: () => void;
  onContinue: () => void;
}

const Rules: React.FC<RulesProps> = ({ onBack, onContinue }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold text-red-600 mb-12">
          Rules!
        </h1>
        
        <div className="space-y-8 text-white text-lg">
          <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
            <p className="text-xl">Answer honestly.</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
            <p className="text-xl">Contradiction raises your score.</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
            <p className="text-xl">More votes leads to disqualification.</p>
          </div>
        </div>
        
        <div className="mt-12 space-x-4">
          <button
            onClick={onContinue}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
          >
            Continue
          </button>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg flex items-center mx-auto mt-4"
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

export default Rules;
