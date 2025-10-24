import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface ModesProps {
  onBack: () => void;
  onModeSelect: (mode: 'single' | 'multiplayer') => void;
}

const Modes: React.FC<ModesProps> = ({ onBack, onModeSelect }) => {
  const { t } = useLanguage();
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">

      <div className="max-w-2xl w-full text-center relative z-10">
        <motion.h1 
          className="text-5xl font-bold text-red-600 mb-12 cursor-pointer"
          style={{
            textShadow: isHovering
              ? '0 0 25px rgba(255, 64, 64, 0.8), 0 0 50px rgba(255, 64, 64, 0.6)'
              : '0 0 15px rgba(255, 64, 64, 0.5), 0 0 30px rgba(255, 64, 64, 0.3)'
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          animate={{
            scale: isHovering ? 1.05 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut"
          }}
        >
          {t('modes')}
        </motion.h1>
        
        <div className="space-y-6">
          <motion.button
            onClick={() => onModeSelect('single')}
            className="w-full liquid-hover bg-gray-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg"
            whileTap={{ scale: 0.98 }}
          >
            <span>{t('solo')}</span>
          </motion.button>
          
          <motion.button
            onClick={() => onModeSelect('multiplayer')}
            className="w-full liquid-hover bg-gray-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg"
            whileTap={{ scale: 0.98 }}
          >
            <span>{t('party')}</span>
          </motion.button>
        </div>
        
        <div className="mt-12">
          <motion.button
            onClick={onBack}
            className="liquid-hover bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center mx-auto"
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>{t('home')}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Modes;
