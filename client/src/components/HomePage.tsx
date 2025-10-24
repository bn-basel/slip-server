import React from 'react';

interface HomePageProps {
  onNavigate: (page: 'rules' | 'settings') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-2xl w-full text-center">
        <h1 
          className="text-6xl font-bold text-red-600 mb-12"
          style={{
            textShadow: '0 0 15px rgba(255, 64, 64, 0.5), 0 0 30px rgba(255, 64, 64, 0.3)'
          }}
        >
          The Slip
        </h1>
        
        <div className="space-y-6">
          <button
            onClick={() => onNavigate('rules')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg"
          >
            Start
          </button>
          
          <button
            onClick={() => onNavigate('settings')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
