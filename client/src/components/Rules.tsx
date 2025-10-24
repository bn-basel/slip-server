import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface RulesProps {
  onBack: () => void;
  onContinue: () => void;
}

const Rules: React.FC<RulesProps> = ({ onBack, onContinue }) => {
  const { t } = useLanguage();
  const [titleGlow, setTitleGlow] = useState(false);
  const [ruleVisible, setRuleVisible] = useState([false, false, false, false]);
  const [isHovering, setIsHovering] = useState(false);

  // Trigger animation sequence when component mounts
  useEffect(() => {
    // Start title glow
    setTitleGlow(true);
    
    // Start rule fade-in sequence after title glow
    const timer1 = setTimeout(() => {
      setTitleGlow(false);
    }, 1000);

    const timer2 = setTimeout(() => {
      setRuleVisible([true, false, false, false]);
    }, 1200);

    const timer3 = setTimeout(() => {
      setRuleVisible([true, true, false, false]);
    }, 1400);

    const timer4 = setTimeout(() => {
      setRuleVisible([true, true, true, false]);
    }, 1600);

    const timer5 = setTimeout(() => {
      setRuleVisible([true, true, true, true]);
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">

      <div className="max-w-2xl w-full text-center relative z-10">
        <motion.h1 
          className="text-5xl font-bold text-red-600 mb-12 cursor-pointer"
          style={{
            textShadow: titleGlow || isHovering
              ? '0 0 25px rgba(255, 64, 64, 0.8), 0 0 50px rgba(255, 64, 64, 0.6)'
              : '0 0 10px rgba(255, 64, 64, 0.3)'
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
          {t('rules')}
        </motion.h1>
        
        <div className="space-y-8 text-white text-lg">
          <div 
            className={`bg-gray-900 rounded-lg p-6 shadow-lg transition-all duration-500 ${
              ruleVisible[0] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
            }`}
          >
            <p className="text-xl">{t('rule1')}</p>
          </div>
          
          <div 
            className={`bg-gray-900 rounded-lg p-6 shadow-lg transition-all duration-500 ${
              ruleVisible[1] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
            }`}
          >
            <p className="text-xl">{t('rule2')}</p>
          </div>
          
          <div 
            className={`bg-gray-900 rounded-lg p-6 shadow-lg transition-all duration-500 ${
              ruleVisible[2] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
            }`}
          >
            <p className="text-xl">{t('rule3')}</p>
          </div>

          <div 
            className={`bg-gray-900 rounded-lg p-6 shadow-lg transition-all duration-500 ${
              ruleVisible[3] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
            }`}
          >
            <p className="text-xl">{t('rule4')}</p>
          </div>
        </div>
        
        <div className="mt-12 flex flex-col items-center space-y-4">
          <motion.button
            onClick={onContinue}
            className="liquid-hover text-white font-bold py-4 px-12 rounded-lg shadow-lg text-xl"
            whileTap={{ scale: 0.98 }}
          >
            <span>{t('continue')}</span>
          </motion.button>
          
          <motion.button
            onClick={onBack}
            className="liquid-hover text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center"
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

export default Rules;
