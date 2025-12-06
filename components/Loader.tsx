
import React from 'react';

const Ring: React.FC<{ delay: string }> = ({ delay }) => (
  <div
    className="absolute rounded-full border-2 border-brand-primary/50"
    style={{
      width: '10rem',
      height: '10rem',
      animation: `pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite`,
      animationDelay: delay,
    }}
  ></div>
);

export const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex flex-col justify-center items-center z-[100] text-white animate-fade-in">
      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.33);
            opacity: 1;
          }
          80%, 100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
      <div className="relative w-40 h-40 flex items-center justify-center">
        <Ring delay="0s" />
        <Ring delay="0.5s" />
        <svg
          className="w-16 h-16 text-brand-primary dark:text-indigo-400 animate-spin-slow absolute"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
          <path d="M12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="mt-8 text-lg font-semibold tracking-wider">Aligning the cosmos...</p>
      <p className="text-sm text-gray-300">Decoding your energetic signature.</p>
    </div>
  );
};
