import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface HomePageProps {
  onNavigate: (page: 'rules' | 'settings') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">

      <div className="max-w-2xl w-full text-center relative z-10">
        <motion.h1 
          className="text-6xl font-bold text-red-600 mb-12 cursor-pointer"
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
          {t('appTitle')}
        </motion.h1>
        
        <div className="space-y-6">
          <motion.button
            onClick={() => onNavigate('rules')}
            className="w-full liquid-hover bg-gray-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg"
            whileTap={{ scale: 0.98 }}
          >
            <span>{t('start')}</span>
          </motion.button>
          
          <motion.button
            onClick={() => onNavigate('settings')}
            className="w-full liquid-hover bg-gray-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg"
            whileTap={{ scale: 0.98 }}
          >
            <span>{t('settings')}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
