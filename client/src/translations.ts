export const translations = {
  en: {
    // App title
    appTitle: "The Slip",
    
    // Navigation
    home: "Home",
    start: "Start",
    settings: "Settings",
    back: "Back to Home",
    continue: "Continue",
    
    // Rules
    rules: "Rules!",
    rule1: "Answer honestly.",
    rule2: "Contradiction raises your score.",
    rule3: "More votes leads to disqualification.",
    rule4: "Better, more thoughtful answers allow for deeper analysis.",
    
    // Modes
    modes: "Modes",
    solo: "Solo",
    party: "Party",
    
    // Settings
    settingsTitle: "Settings",
    languageToggle: "🇺🇸 English / 🇸🇦 العربية",
    comingSoon: "Coming Soon",
    settingsDescription: "Settings and customization options will be available in a future update.",
    
    // Single Player Game
    welcome: "Welcome to The Slip",
    welcomeArabic: "مرحباً بك في The Slip",
    answerInEnglish: "(أجب باللغة الإنجليزية)",
    gameDescription: "An AI Judge will test your philosophical consistency. Your consistency score starts at 100% and decreases when you contradict yourself.",
    startGame: "Start Game",
    starting: "Starting...",
    question: "Question",
    typeAnswer: "Type your answer here...",
    submitAnswer: "Submit Answer",
    aiJudging: "AI is judging...",
    aiJudgeVerdict: "AI Judge Verdict",
    consistencyScore: "Consistency Score:",
    aiJudge: "AI Judge:",
    endGame: "End Game",
    gameOver: "Game Over",
    lostConsistency: "You lost consistency!",
    finalScore: "Final Score:",
    playAgain: "Play Again",
    
    // Multiplayer
    multiplayerMode: "Multiplayer Mode",
    multiplayerDescription: "Multiplayer functionality is coming soon! This will allow multiple players to compete in consistency challenges.",
    
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success"
  },
  ar: {
    // App title
    appTitle: "The Slip",
    
    // Navigation
    home: "الرئيسية",
    start: "ابدأ",
    settings: "الإعدادات",
    back: "العودة للرئيسية",
    continue: "متابعة",
    
    // Rules
    rules: "القواعد!",
    rule1: "أجب بصدق.",
    rule2: "التناقض يرفع نقاطك.",
    rule3: "المزيد من الأصوات يؤدي إلى الإقصاء.",
    rule4: "الإجابات الأفضل والأكثر تفكيراً تسمح بتحليل أعمق.",
    
    // Modes
    modes: "أنواع اللعب",
    solo: "فردي",
    party: "جماعي",
    
    // Settings
    settingsTitle: "الإعدادات",
    languageToggle: "🇺🇸 English / 🇸🇦 العربية",
    comingSoon: "قريباً",
    settingsDescription: "خيارات الإعدادات والتخصيص ستكون متاحة في تحديث مستقبلي.",
    
    // Single Player Game
    welcome: "مرحباً بك في The Slip",
    welcomeArabic: "مرحباً بك في The Slip",
    answerInEnglish: "(أجب باللغة الإنجليزية)",
    gameDescription: "قاضي الذكاء الاصطناعي سيقوم باختبار اتساقك الفلسفي. تبدأ نقاط الاتساق عند 100% وتنخفض عندما تتناقض مع نفسك.",
    startGame: "ابدأ اللعبة",
    starting: "جاري البدء...",
    question: "السؤال",
    typeAnswer: "اكتب إجابتك هنا...",
    submitAnswer: "إرسال الإجابة",
    aiJudging: "القاضي يحكم...",
    aiJudgeVerdict: "حكم القاضي الذكي",
    consistencyScore: "نقاط الاتساق:",
    aiJudge: "القاضي الذكي:",
    endGame: "إنهاء اللعبة",
    gameOver: "انتهت اللعبة",
    lostConsistency: "فقدت الاتساق!",
    finalScore: "النقاط النهائية:",
    playAgain: "العب مرة أخرى",
    
    // Multiplayer
    multiplayerMode: "الوضع الجماعي",
    multiplayerDescription: "وظائف اللعب الجماعي قادمة قريباً! سيتيح هذا للاعبين متعددين التنافس في تحديات الاتساق.",
    
    // Common
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجح"
  }
};

export type Language = 'en' | 'ar';
export type TranslationKey = keyof typeof translations.en;
