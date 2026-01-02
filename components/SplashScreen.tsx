import React, { useEffect, useState } from 'react';
import { APP_NAME, AUTHOR_HANDLE } from '../constants';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Fade out sequence
    const timer1 = setTimeout(() => {
      setOpacity(0);
    }, 2500); // Hold for 2.5s

    const timer2 = setTimeout(() => {
      onFinish();
    }, 3000); // Unmount after fade

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-1000"
      style={{ opacity }}
    >
      <div className="relative animate-pulse">
        <div className="w-48 h-64 border border-neutral-800 rounded-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite_reverse] opacity-20"></div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white z-10 relative neon-flicker">
          {APP_NAME}
        </h1>
      </div>
      
      <p className="absolute bottom-12 text-xs text-neutral-600 tracking-[0.2em] uppercase">
        by {AUTHOR_HANDLE}
      </p>

      <style>{`
        .neon-flicker {
          text-shadow: 0 0 10px rgba(255,255,255,0.1);
          animation: flicker 3s infinite alternate;
        }
        @keyframes flicker {
          0%, 18%, 22%, 25%, 53%, 57%, 100% {
            text-shadow: 0 0 4px #fff, 0 0 11px #fff, 0 0 19px #fff, 0 0 40px #0fa;
          }
          20%, 24%, 55% {       
            text-shadow: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
