import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface MultiplayerProps {
  onBack: () => void;
}

const Multiplayer: React.FC<MultiplayerProps> = ({ onBack }) => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-6"
              style={{
                textShadow: '0 0 15px rgba(255, 64, 64, 0.5), 0 0 30px rgba(255, 64, 64, 0.3)'
              }}>
            {t('multiplayerMode')}
          </h2>
          
          <p className="text-lg text-gray-300 mb-8">
            {t('multiplayerDescription')}
          </p>
          
          <button
            onClick={onBack}
            className="liquid-hover bg-gray-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg"
          >
            {t('back')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Multiplayer;
