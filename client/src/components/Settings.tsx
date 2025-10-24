import React from 'react';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-2xl w-full text-center">
        <h1 
          className="text-5xl font-bold text-red-600 mb-12"
          style={{
            textShadow: '0 0 15px rgba(255, 64, 64, 0.5), 0 0 30px rgba(255, 64, 64, 0.3)'
          }}
        >
          Settings
        </h1>
        
        <div className="bg-gray-900 rounded-lg p-8 shadow-lg">
          <p className="text-2xl text-white mb-8">
            Coming Soon
          </p>
          <p className="text-gray-300 text-lg">
            Settings and customization options will be available in a future update.
          </p>
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

export default Settings;
