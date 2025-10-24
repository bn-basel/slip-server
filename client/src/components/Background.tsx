import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Hexagonal Network Background */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="hexPattern" x="0" y="0" width="20" height="17.32" patternUnits="userSpaceOnUse">
            <polygon
              points="10,2 18,6 18,14 10,18 2,14 2,6"
              fill="none"
              stroke="#ff4040"
              strokeWidth="0.1"
              opacity="0.05"
            />
            <polygon
              points="10,2 18,6 18,14 10,18 2,14 2,6"
              fill="none"
              stroke="#aaaaaa"
              strokeWidth="0.05"
              opacity="0.08"
            />
          </pattern>
        </defs>
        
        {/* Animated hexagons */}
        <rect width="100%" height="100%" fill="url(#hexPattern)" />
        
        {/* Floating hexagons */}
        <g className="opacity-30">
          <polygon
            points="20,10 26,13 26,19 20,22 14,19 14,13"
            fill="none"
            stroke="#ff4040"
            strokeWidth="0.2"
            opacity="0.1"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 2,1; 0,0"
              dur="8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.1; 0.3; 0.1"
              dur="6s"
              repeatCount="indefinite"
            />
          </polygon>
          
          <polygon
            points="60,30 66,33 66,39 60,42 54,39 54,33"
            fill="none"
            stroke="#aaaaaa"
            strokeWidth="0.15"
            opacity="0.1"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -1,2; 0,0"
              dur="10s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.1; 0.2; 0.1"
              dur="7s"
              repeatCount="indefinite"
            />
          </polygon>
          
          <polygon
            points="80,60 86,63 86,69 80,72 74,69 74,63"
            fill="none"
            stroke="#ff4040"
            strokeWidth="0.1"
            opacity="0.08"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 1,-1; 0,0"
              dur="12s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.08; 0.15; 0.08"
              dur="9s"
              repeatCount="indefinite"
            />
          </polygon>
        </g>
        
        {/* Connecting lines */}
        <g className="opacity-20">
          <line
            x1="20"
            y1="10"
            x2="60"
            y2="30"
            stroke="#ff4040"
            strokeWidth="0.1"
            opacity="0.05"
          >
            <animate
              attributeName="opacity"
              values="0.05; 0.1; 0.05"
              dur="5s"
              repeatCount="indefinite"
            />
          </line>
          
          <line
            x1="60"
            y1="30"
            x2="80"
            y2="60"
            stroke="#aaaaaa"
            strokeWidth="0.08"
            opacity="0.06"
          >
            <animate
              attributeName="opacity"
              values="0.06; 0.12; 0.06"
              dur="6s"
              repeatCount="indefinite"
            />
          </line>
        </g>
      </svg>
    </div>
  );
};

export default Background;
