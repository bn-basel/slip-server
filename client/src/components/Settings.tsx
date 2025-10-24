import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-2xl w-full text-center">
        <h1 
          className="text-5xl font-bold text-red-600 mb-12"
          style={{
            textShadow: '0 0 15px rgba(255, 64, 64, 0.5), 0 0 30px rgba(255, 64, 64, 0.3)'
          }}
        >
          {t('settingsTitle')}
        </h1>
        
        <div className="bg-gray-900 rounded-lg p-8 shadow-lg">
          {/* Language Toggle */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">
              Language / اللغة
            </h3>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setLanguage('en')}
                className={`liquid-hover text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center ${
                  language === 'en' ? 'bg-red-600' : ''
                }`}
              >
                <span className="text-2xl mr-2">🇺🇸</span>
                English
              </button>
              <span className="text-gray-400 text-xl">/</span>
              <button
                onClick={() => setLanguage('ar')}
                className={`liquid-hover text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center ${
                  language === 'ar' ? 'bg-red-600' : ''
                }`}
              >
                <span className="text-2xl mr-2">🇸🇦</span>
                العربية
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-2xl text-white mb-6">
              {t('comingSoon')}
            </p>
            <p className="text-gray-300 text-lg">
              {t('settingsDescription')}
            </p>
          </div>
        </div>
        
        <div className="mt-12">
          <button
            onClick={onBack}
            className="liquid-hover bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center mx-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t('home')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
